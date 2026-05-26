# Loada — AWS Deployment Guide

Last updated: 2026-05-26

This guide covers the full production deployment of Loada on AWS.
Target: a single EC2 `t3.medium` running the API, admin panel, and BullMQ workers,
with PostgreSQL on RDS and Redis on the same EC2 instance.

---

## Architecture

```
Internet
  │
  ├── Cloudflare (orange cloud) ──→ EC2 :443 (NGINX SSL termination)
  │       api.loada.app                │
  │       admin.loada.app              │
  │                                    │
  └── Cloudflare (grey, DNS-only) ─→  EC2 :80 (NGINX → 3000 Socket.IO)
          socket.loada.app

EC2 t3.medium (Ubuntu 24.04 LTS)
  ├── NGINX (80/443) ─────────────────────────────┐
  │                                                │
  ├── PM2                                          │
  │    ├── loada-api      :3000  (Fastify + Socket.IO)
  │    ├── loada-admin    :3001  (Next.js)
  │    ├── loada-worker-bid-expiry
  │    ├── loada-worker-radius-expansion
  │    ├── loada-worker-notification
  │    ├── loada-worker-paynow-poll
  │    └── loada-worker-subscription-renewal
  │
  └── Redis 7              :6379  (local, no TLS for MVP)

RDS PostgreSQL 16 + PostGIS    (separate, private subnet)
S3 bucket                      (loada-prod-assets)
```

---

## Pre-deployment checklist

- [ ] AWS account with billing alerts set at $50 / $100 / $200
- [ ] EC2 key pair created and `.pem` stored securely
- [ ] Cloudflare account with `loada.app` zone added
- [ ] Google Maps API key with Places, Geocoding, Directions APIs enabled
- [ ] Firebase project created with FCM enabled; service account JSON downloaded
- [ ] BulkIT account active with sender ID approved
- [ ] Paynow merchant account active with integration ID + key
- [ ] Sentry projects created (API + Mobile) with DSNs
- [ ] Grafana Cloud account created (free tier)

---

## 1. EC2 instance

### Launch settings
| Setting | Value |
|---------|-------|
| AMI | Ubuntu Server 24.04 LTS (64-bit x86) |
| Instance type | t3.medium (2 vCPU, 4 GB RAM) |
| Storage | 20 GB gp3 (root) |
| Security group | See below |
| Key pair | Your EC2 key pair |
| Elastic IP | Allocate one and associate it |

### Security group rules
| Direction | Port | Source | Purpose |
|-----------|------|--------|---------|
| Inbound | 22 | Your IP only | SSH |
| Inbound | 80 | 0.0.0.0/0 | HTTP (Cloudflare redirect + certbot) |
| Inbound | 443 | 0.0.0.0/0 | HTTPS (Cloudflare proxied) |
| Outbound | All | 0.0.0.0/0 | Outbound (APIs, S3, RDS, etc.) |

> Redis (6379) is NOT exposed externally. It binds to 127.0.0.1 only.

---

## 2. RDS PostgreSQL

### Launch settings
| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 16.x |
| Template | Free tier / Single-AZ for MVP |
| Instance class | db.t3.micro |
| Storage | 20 GB gp2, no autoscaling for MVP |
| DB name | `loada_prod` |
| VPC | Same VPC as EC2 |
| Public access | No |
| Security group | Allow 5432 inbound from EC2 security group only |

### Enable PostGIS after creation
Connect to RDS from EC2:
```bash
psql -h <rds-endpoint> -U loadadb -d loada_prod
```
```sql
CREATE EXTENSION postgis;
CREATE EXTENSION postgis_topology;
```

### Required index (add after first migration)
```sql
CREATE INDEX IF NOT EXISTS idx_job_status_tonnes
  ON "Job" (status, "requiredTonnes");
```

---

## 3. S3 bucket

```bash
# Create bucket (replace region if needed)
aws s3api create-bucket \
  --bucket loada-prod-assets \
  --region us-east-1

# Block all public access
aws s3api put-public-access-block \
  --bucket loada-prod-assets \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket loada-prod-assets \
  --versioning-configuration Status=Enabled

# CORS (required for mobile presigned URL uploads)
aws s3api put-bucket-cors \
  --bucket loada-prod-assets \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedOrigins": ["*"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

### IAM user for the API
Create an IAM user `loada-api` with this inline policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": "arn:aws:s3:::loada-prod-assets/*"
  }]
}
```
Generate access keys and put them in the API `.env`.

---

## 4. EC2 server setup

SSH in:
```bash
ssh -i your-key.pem ubuntu@<elastic-ip>
```

### System updates + dependencies
```bash
sudo apt-get update && sudo apt-get upgrade -y

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Build tools (for native npm packages)
sudo apt-get install -y build-essential python3

# Redis 7
sudo apt-get install -y redis-server

# NGINX
sudo apt-get install -y nginx

# Certbot (Let's Encrypt)
sudo apt-get install -y certbot python3-certbot-nginx

# Git
sudo apt-get install -y git

# PM2 (global)
sudo npm install -g pm2

# PostgreSQL client (for running migrations from EC2 against RDS)
sudo apt-get install -y postgresql-client-16
```

### Redis configuration
```bash
sudo nano /etc/redis/redis.conf
```
Change or add:
```
bind 127.0.0.1
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""
# Disable persistence — Redis is transient cache only. Job data is in Postgres.
appendonly no
```
```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

Verify:
```bash
redis-cli ping
# Expected: PONG
```

---

## 5. Deploy the application

### Clone the repository
```bash
cd /srv
sudo git clone https://github.com/theonga/loada.git loada
sudo chown -R ubuntu:ubuntu /srv/loada
```

### Install dependencies
```bash
cd /srv/loada
npm install --workspaces   # installs all workspace packages
```

### Configure environment variables

API:
```bash
cp /srv/loada/apps/api/.env.example /srv/loada/apps/api/.env
nano /srv/loada/apps/api/.env
```

Fill in all values — see the complete variable list in `apps/api/.env.example`.
Critical values to change from defaults:
- `DATABASE_URL` — point to RDS endpoint
- `JWT_SECRET` — generate: `openssl rand -hex 64`
- `JWT_REFRESH_SECRET` — generate: `openssl rand -hex 64`
- `ADMIN_JWT_SECRET` — generate: `openssl rand -hex 64`
- `ADMIN_SEED_PASSWORD` — set a strong password before seeding
- All AWS, Google, Firebase, BulkIT, Paynow, Sentry values

Admin panel:
```bash
cp /srv/loada/apps/admin/.env.example /srv/loada/apps/admin/.env.local
nano /srv/loada/apps/admin/.env.local
# NEXT_PUBLIC_API_URL=https://api.loada.app
```

### Build the API
```bash
cd /srv/loada/apps/api
npm run build      # tsc → dist/
```

### Build the admin panel
```bash
cd /srv/loada/apps/admin
npm run build
```

### Run database migrations
```bash
cd /srv/loada/apps/api
npx prisma migrate deploy    # applies all pending migrations
npx prisma db seed           # seeds config keys and admin user (run once only)
```

> **Important:** Change the admin password immediately after seeding.
> Log in to `https://admin.loada.app` and change from `changeme123`.

---

## 6. NGINX configuration

```bash
sudo cp /srv/loada/docs/nginx.conf /etc/nginx/sites-available/loada
sudo ln -sf /etc/nginx/sites-available/loada /etc/nginx/sites-enabled/loada
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t    # verify config
sudo systemctl reload nginx
```

The NGINX config is at `docs/nginx.conf`. It handles:
- `api.loada.app` → port 3000 (Fastify)
- `socket.loada.app` → port 3000 (Socket.IO, WebSocket upgrade headers)
- `admin.loada.app` → port 3001 (Next.js)

---

## 7. SSL certificates

Cloudflare must be set to DNS-only (grey cloud) for certbot's HTTP-01 challenge to reach the server.
Temporarily grey-cloud all records, run certbot, then re-orange-cloud `api` and `admin` (not `socket`).

```bash
sudo certbot --nginx \
  -d api.loada.app \
  -d admin.loada.app \
  -d socket.loada.app \
  --email clouditate@gmail.com \
  --agree-tos \
  --non-interactive
```

Certbot writes SSL server blocks to the NGINX config automatically.
Auto-renewal is set up by certbot via a systemd timer — verify:
```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

After certificates are issued:
- Re-enable Cloudflare orange cloud for `api.loada.app` and `admin.loada.app`
- Leave `socket.loada.app` on grey cloud (DNS-only) — Cloudflare cannot proxy WebSockets on free plan

---

## 8. Cloudflare DNS

| Name | Type | Target | Proxy |
|------|------|--------|-------|
| `api` | A | `<EC2 Elastic IP>` | Proxied (orange) |
| `admin` | A | `<EC2 Elastic IP>` | Proxied (orange) |
| `socket` | A | `<EC2 Elastic IP>` | DNS-only (grey) |

In Cloudflare SSL/TLS settings: set to **Full (strict)** once certificates are in place.

### Recommended Cloudflare rules
- Page rule: `api.loada.app/*` → Cache Level: Bypass (API responses must not be cached)
- Page rule: `admin.loada.app/*` → Cache Level: Bypass

---

## 9. PM2 process management

```bash
cd /srv/loada
pm2 start ecosystem.config.js --env production
pm2 save          # persist process list to survive reboots
pm2 startup       # generate the systemd unit and print the command to run
# Run the printed command (sudo env PATH=... pm2 startup systemd ...)
```

Verify all processes are running:
```bash
pm2 status
# Should show: loada-api (online), loada-admin (online), and all workers (online)
```

View logs:
```bash
pm2 logs loada-api --lines 100
pm2 logs loada-worker-notification --lines 50
```

---

## 10. Post-deployment verification

```bash
# API health
curl https://api.loada.app/health
# → {"status":"ok","timestamp":"..."}

# Admin panel
curl -I https://admin.loada.app/login
# → HTTP/2 200

# OTP flow (replaces real SMS in dry-run mode)
curl -X POST https://api.loada.app/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+263771234567"}'
# → {"success":true,"data":{"message":"OTP sent"}}
```

Test Socket.IO connectivity from a browser console:
```javascript
const io = require('socket.io-client');
const s = io('https://socket.loada.app/jobs', { auth: { token: '<access_token>' } });
s.on('connect', () => console.log('connected', s.id));
```

---

## 11. Mobile app (Expo/EAS)

The mobile app is built with EAS Build and submitted to the App Store / Play Store.
Local Expo Go is for development only.

### EAS setup (first time)
```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build:configure
```

### Production build
```bash
# Android APK/AAB
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production
```

### EAS Update (OTA updates — JS bundle only, no store review)
```bash
eas update --branch production --message "Fix subscription polling"
```

### Environment for EAS builds
Set these in the EAS dashboard (`eas.json` and EAS Secrets):
```
EXPO_PUBLIC_API_URL=https://api.loada.app
EXPO_PUBLIC_SOCKET_URL=https://socket.loada.app
EXPO_PUBLIC_GOOGLE_MAPS_KEY=<your key>
EXPO_PUBLIC_SENTRY_DSN=<mobile sentry dsn>
```

---

## 12. Subsequent deploys

```bash
cd /srv/loada

# Pull latest code
git pull origin main

# Install any new dependencies
npm install --workspaces

# API: build + migrate
cd apps/api
npm run build
npx prisma migrate deploy

# Admin panel: build
cd ../admin
npm run build

# Zero-downtime reload (PM2)
cd ../..
pm2 reload ecosystem.config.js --env production

# Verify
pm2 status
curl https://api.loada.app/health
```

If a migration requires downtime (rare), stop the API first:
```bash
pm2 stop loada-api
npx prisma migrate deploy
pm2 start loada-api
```

---

## 13. Rollback

```bash
cd /srv/loada
git log --oneline -10     # find the commit to roll back to
git checkout <commit-hash>

cd apps/api && npm run build
cd ../admin && npm run build
cd ../..
pm2 reload ecosystem.config.js --env production
```

Database rollbacks are manual — there is no `prisma migrate revert`.
If a migration needs to be undone, write a new migration that reverses the change.

---

## 14. Monitoring

### Grafana Cloud (free tier)
Install the Grafana agent on EC2:
```bash
ARCH="amd64" GRAFANA_VERSION="latest"
wget -q -O - https://apt.grafana.com/gpg.key | sudo apt-key add -
echo "deb https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update && sudo apt-get install -y grafana-agent
```

Key metrics to watch:
- API response time (p50/p95) — alert if p95 > 2s
- Queue depth (`loada:*` Redis keys) — alert if bid-expiry queue backs up
- RDS connections — t3.micro max is ~66; alert at 50
- Redis memory — alert at 200 MB (of 256 MB limit)
- EC2 CPU — alert at 80% sustained

### PM2 built-in monitoring
```bash
pm2 monit    # live dashboard: CPU, memory, restarts per process
```

### Sentry
The `SENTRY_DSN` env var enables automatic error capture in the API.
Check the Sentry dashboard for unhandled exceptions and slow transactions.

---

## 15. Security hardening

```bash
# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Disable password auth (key-only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban for SSH brute force
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban

# Automatic security updates
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Admin panel IP restriction (recommended)
Uncomment and configure in `docs/nginx.conf`:
```nginx
server {
  server_name admin.loada.app;

  allow 203.0.113.0/24;   # Your office/VPN CIDR
  deny  all;
  ...
}
```
Then reload: `sudo nginx -t && sudo systemctl reload nginx`

---

## 16. Backup

### RDS automated backups
Enable in the RDS console: **7-day retention**, automated backups, backup window 02:00–03:00 UTC.

### Redis
Redis has no persistence enabled (`save ""`). All data is transient (OTPs, driver locations,
bid sessions, config cache). Redis loss means users must re-OTP and drivers must re-ping.
This is acceptable for MVP.

### EC2 (application code + config)
The application code is in Git. The only non-Git state on EC2 is:
- `/srv/loada/apps/api/.env` — back up to AWS Secrets Manager
- `/srv/loada/apps/admin/.env.local` — back up to AWS Secrets Manager
- PM2 process list (`pm2 save` persists to `~/.pm2/dump.pm2`)

---

## Environment variable reference

Full variable list for `apps/api/.env`:

```bash
NODE_ENV=production
PORT=3000

# PostgreSQL (RDS)
DATABASE_URL=postgresql://loadadb:<password>@<rds-endpoint>:5432/loada_prod

# Redis (local)
REDIS_URL=redis://127.0.0.1:6379

# JWT — generate with: openssl rand -hex 64
JWT_SECRET=<64-char random hex>
JWT_REFRESH_SECRET=<64-char random hex>
ADMIN_JWT_SECRET=<64-char random hex>

# Admin seed (used once by db:seed — change password immediately after)
ADMIN_SEED_USERNAME=admin
ADMIN_SEED_PASSWORD=<strong password>

# AWS S3
AWS_ACCESS_KEY_ID=<IAM user key>
AWS_SECRET_ACCESS_KEY=<IAM user secret>
AWS_S3_BUCKET=loada-prod-assets
AWS_REGION=us-east-1

# Google Maps
GOOGLE_MAPS_API_KEY=<server-side key, restrict to your EC2 IP>

# Firebase Admin SDK (FCM push notifications)
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com

# BulkIT SMS
BULKIT_SMS_API_URL=https://api.npr.bulkit.co.zw/api/messages/send
BULKIT_SMS_USERNAME=<username>
BULKIT_SMS_PASSWORD=<password>
BULKIT_SMS_SENDER=<sender ID>
SMS_DRY_RUN=false

# Paynow
PAYNOW_INTEGRATION_ID=<integration ID>
PAYNOW_INTEGRATION_KEY=<integration key>

# Sentry (optional — omit to disable)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Costs (estimated, MVP)

| Service | Tier | Monthly cost |
|---------|------|-------------|
| EC2 t3.medium | On-demand | ~$30 |
| RDS db.t3.micro | Single-AZ | ~$15 |
| S3 | First 5 GB free, then $0.023/GB | < $5 |
| Cloudflare | Free plan | $0 |
| Grafana Cloud | Free tier | $0 |
| Google Maps | $200/mo credit (free tier) | $0 until scale |
| Firebase FCM | Free | $0 |
| Sentry | Free tier | $0 |
| **Total** | | **~$50/month** |

Upgrade path when you outgrow t3.medium:
1. Move Redis to ElastiCache (separate the cache from the app)
2. Move workers to separate EC2 or Lambda
3. Add a second API instance behind a load balancer (requires Socket.IO Redis adapter)
4. Upgrade RDS to db.t3.small, enable Multi-AZ
