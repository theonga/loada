// PM2 process configuration for Loada
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup
//   pm2 reload ecosystem.config.js --env production   ← zero-downtime reload

module.exports = {
  apps: [
    // ── API ──────────────────────────────────────────────────────────────────
    // Single instance required: Socket.IO is attached to the same http.Server.
    // To scale horizontally, add a Redis adapter (socket.io-redis) and increase
    // instances — but sticky sessions must be enabled in nginx (ip_hash) first.
    {
      name: "loada-api",
      cwd: "./apps/api",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/pm2/loada-api-error.log",
      out_file:   "/var/log/pm2/loada-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 2000,
      max_restarts: 10,
    },

    // ── Admin panel ───────────────────────────────────────────────────────────
    // Next.js standalone server.
    // Build first: cd apps/admin && npm run build
    {
      name: "loada-admin",
      cwd: "./apps/admin",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production",
        NEXT_PUBLIC_API_URL: "https://api.loada.app",
        PORT: 3001,
      },
      error_file: "/var/log/pm2/loada-admin-error.log",
      out_file:   "/var/log/pm2/loada-admin-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 2000,
      max_restarts: 10,
    },
  ],
};
