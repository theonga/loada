import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CONFIG_SEED: Array<{ key: string; value: string; label: string; group: string }> = [
  { key: "subscription_price_weekly",         value: "8",    label: "Weekly subscription price (USD)",          group: "pricing" },
  { key: "subscription_price_monthly",        value: "28",   label: "Monthly subscription price (USD)",         group: "pricing" },
  { key: "subscription_price_annual",         value: "280",  label: "Annual subscription price (USD)",          group: "pricing" },
  { key: "trial_period_days",                 value: "7",    label: "Trial period (days)",                      group: "pricing" },
  { key: "bid_ttl_seconds",                   value: "300",  label: "Bid TTL (seconds)",                        group: "bidding" },
  { key: "max_active_bids_per_driver",        value: "3",    label: "Max active bids per driver",               group: "bidding" },
  { key: "initial_search_radius_km",          value: "25",   label: "Initial driver search radius (km)",        group: "matching" },
  { key: "radius_expansion_interval_seconds", value: "60",   label: "Radius expansion interval (seconds)",      group: "matching" },
  { key: "radius_expansion_increment_km",     value: "15",   label: "Radius expansion increment (km)",          group: "matching" },
  { key: "radius_expansion_max_count",        value: "3",    label: "Max radius expansions",                    group: "matching" },
  { key: "otp_expiry_seconds",                value: "600",  label: "OTP expiry (seconds)",                     group: "auth" },
  { key: "paynow_poll_interval_seconds",      value: "10",   label: "Paynow poll interval (seconds)",           group: "payments" },
  { key: "paynow_poll_timeout_seconds",       value: "300",  label: "Paynow poll timeout (seconds)",            group: "payments" },
  { key: "market_ref_cache_ttl_seconds",      value: "3600", label: "Market reference cache TTL (seconds)",     group: "market" },
  { key: "market_ref_min_sample",             value: "5",    label: "Market reference minimum sample size",     group: "market" },
  { key: "per_km_rate_1t",                    value: "0.30", label: "Per-km rate — 1 tonne (USD)",              group: "market" },
  { key: "per_km_rate_2t",                    value: "0.40", label: "Per-km rate — 2 tonnes (USD)",             group: "market" },
  { key: "per_km_rate_5t",                    value: "0.50", label: "Per-km rate — 5 tonnes (USD)",             group: "market" },
  { key: "per_km_rate_10t",                   value: "0.60", label: "Per-km rate — 10 tonnes (USD)",            group: "market" },
  { key: "per_km_rate_20t",                   value: "0.70", label: "Per-km rate — 20 tonnes (USD)",            group: "market" },
  { key: "per_km_rate_30t",                   value: "0.80", label: "Per-km rate — 30 tonnes (USD)",            group: "market" },
];

async function main() {
  console.log("Seeding Loada database...");

  // Clear in FK-safe order (no cascade on most relations)
  await prisma.rating.deleteMany();
  await prisma.message.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.job.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.driverProfile.deleteMany();
  await prisma.shipperProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appConfig.deleteMany();
  await prisma.admin.deleteMany();

  // ── Shippers ────────────────────────────────────────────────────────────────
  const shipper1 = await prisma.user.create({
    data: {
      phone: "+263771000001",
      name: "Tendai Moyo",
      role: "SHIPPER",
      isVerified: true,
      shipperProfile: {
        create: { companyName: "Moyo Trading Co." },
      },
    },
    include: { shipperProfile: true },
  });

  const shipper2 = await prisma.user.create({
    data: {
      phone: "+263771000002",
      name: "Rudo Chikwanda",
      role: "SHIPPER",
      isVerified: true,
      shipperProfile: {
        create: { companyName: "Chikwanda Agri Supplies" },
      },
    },
    include: { shipperProfile: true },
  });

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const driverData = [
    { name: "Blessing Ncube", phone: "+263772000001", make: "Isuzu", model: "NQR", year: 2018, reg: "AAA-1234", tonnes: 5 },
    { name: "Farai Dube", phone: "+263772000002", make: "Mercedes-Benz", model: "Actros", year: 2020, reg: "BBB-5678", tonnes: 20 },
    { name: "Kudzai Sithole", phone: "+263772000003", make: "MAN", model: "TGX", year: 2019, reg: "CCC-9012", tonnes: 30 },
    { name: "Tafadzwa Mutasa", phone: "+263772000004", make: "Hino", model: "500", year: 2017, reg: "DDD-3456", tonnes: 10 },
    { name: "Simba Chigwada", phone: "+263772000005", make: "Isuzu", model: "FRR", year: 2021, reg: "EEE-7890", tonnes: 5 },
    { name: "Takudzwa Banda", phone: "+263772000006", make: "Scania", model: "R450", year: 2022, reg: "FFF-1234", tonnes: 30 },
    { name: "Tinashe Mhuru", phone: "+263772000007", make: "Toyota", model: "Dyna", year: 2016, reg: "GGG-5678", tonnes: 2 },
    { name: "Nyasha Zimuto", phone: "+263772000008", make: "Mitsubishi", model: "Canter", year: 2019, reg: "HHH-9012", tonnes: 2 },
  ];

  const drivers = [];
  for (const d of driverData) {
    const user = await prisma.user.create({
      data: {
        phone: d.phone,
        name: d.name,
        role: "DRIVER",
        isVerified: true,
        driverProfile: {
          create: {
            capacityTonnes: d.tonnes,
            truckRegistration: d.reg,
            truckMake: d.make,
            truckModel: d.model,
            truckYear: d.year,
            documentStatus: "APPROVED",
            isOnline: true,
            lastLocationLat: -17.8292 + (Math.random() - 0.5) * 0.2,
            lastLocationLng: 31.0522 + (Math.random() - 0.5) * 0.2,
            lastLocationAt: new Date(),
            subscription: {
              create: {
                plan: "MONTHLY",
                status: "ACTIVE",
                currentPeriodEnd: dayjs().add(30, "day").toDate(),
              },
            },
          },
        },
      },
      include: { driverProfile: true },
    });
    drivers.push(user);
  }

  const shipperProfile1 = shipper1.shipperProfile!;
  const shipperProfile2 = shipper2.shipperProfile!;

  const driver1Profile = drivers[0].driverProfile!;
  const driver2Profile = drivers[1].driverProfile!;

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  const completedJob = await prisma.job.create({
    data: {
      shipperId: shipperProfile1.id,
      originAddress: "Highfield, Harare",
      originLat: -17.8939,
      originLng: 31.0419,
      destAddress: "Bulawayo City Centre",
      destLat: -20.1509,
      destLng: 28.5833,
      cargoDescription: "Bags of maize meal — 500 x 50kg sacks",
      requiredTonnes: 20,
      specialRequirements: [],
      askingPrice: 850,
      currency: "USD",
      status: "COMPLETED",
      searchRadiusKm: 25,
      matchedDriverId: driver2Profile.id,
      biddingExpiresAt: dayjs().subtract(2, "day").toDate(),
      bids: {
        create: {
          driverId: driver2Profile.id,
          offeredPrice: 820,
          currency: "USD",
          status: "ACCEPTED",
        },
      },
      delivery: {
        create: {
          pickupConfirmedAt: dayjs().subtract(1, "day").toDate(),
          pickupPhotoUrl: "delivery/mock-pickup-photo.jpg",
          deliveredAt: dayjs().subtract(12, "hour").toDate(),
          deliveryPhotoUrl: "delivery/mock-delivery-photo.jpg",
          recipientName: "Mr. Chisambiro",
          deliveryLat: -20.1509,
          deliveryLng: 28.5833,
        },
      },
      ratings: {
        create: [
          {
            fromUserId: shipper1.id,
            toUserId: drivers[1].id,
            score: 5,
            tags: ["ON_TIME", "CAREFUL_WITH_CARGO", "PROFESSIONAL"],
            comment: "Excellent service, delivered on time.",
          },
          {
            fromUserId: drivers[1].id,
            toUserId: shipper1.id,
            score: 4,
            tags: ["GOOD_COMMUNICATION"],
            comment: "Cargo was well prepared.",
          },
        ],
      },
    },
  });
  void completedJob;

  const biddingJob = await prisma.job.create({
    data: {
      shipperId: shipperProfile1.id,
      originAddress: "Avondale, Harare",
      originLat: -17.7896,
      originLng: 31.0391,
      destAddress: "Mutare City",
      destLat: -18.9707,
      destLng: 32.6709,
      cargoDescription: "Building materials — cement, steel rods",
      requiredTonnes: 10,
      specialRequirements: ["OVERSIZED"],
      askingPrice: 420,
      currency: "USD",
      status: "BIDDING",
      searchRadiusKm: 25,
      biddingExpiresAt: dayjs().add(4, "minute").toDate(),
    },
  });

  // 4 bids on the BIDDING job
  await prisma.bid.createMany({
    data: [
      { jobId: biddingJob.id, driverId: driver1Profile.id, offeredPrice: 390, currency: "USD", status: "PENDING" },
      { jobId: biddingJob.id, driverId: drivers[2].driverProfile!.id, offeredPrice: 410, currency: "USD", status: "PENDING" },
      { jobId: biddingJob.id, driverId: drivers[3].driverProfile!.id, offeredPrice: 400, currency: "USD", status: "PENDING" },
      { jobId: biddingJob.id, driverId: drivers[4].driverProfile!.id, offeredPrice: 380, currency: "USD", status: "PENDING" },
    ],
  });

  const matchedJob = await prisma.job.create({
    data: {
      shipperId: shipperProfile2.id,
      originAddress: "Borrowdale, Harare",
      originLat: -17.7510,
      originLng: 31.1022,
      destAddress: "Gweru City Centre",
      destLat: -19.4500,
      destLng: 29.8167,
      cargoDescription: "Furniture and household goods",
      requiredTonnes: 5,
      specialRequirements: ["FRAGILE"],
      askingPrice: 280,
      currency: "USD",
      status: "MATCHED",
      searchRadiusKm: 25,
      matchedDriverId: driver1Profile.id,
      biddingExpiresAt: dayjs().subtract(30, "minute").toDate(),
    },
  });
  void matchedJob;

  await prisma.job.create({
    data: {
      shipperId: shipperProfile2.id,
      originAddress: "Chitungwiza Town Centre",
      originLat: -17.9966,
      originLng: 31.0756,
      destAddress: "Masvingo City",
      destLat: -20.0620,
      destLng: 30.8277,
      cargoDescription: "Fresh produce — tomatoes and vegetables",
      requiredTonnes: 2,
      specialRequirements: ["REFRIGERATED"],
      askingPrice: 180,
      currency: "USD",
      status: "POSTED",
      searchRadiusKm: 25,
      biddingExpiresAt: dayjs().add(5, "minute").toDate(),
    },
  });

  await prisma.job.create({
    data: {
      shipperId: shipperProfile1.id,
      originAddress: "Ruwa Industrial Area",
      originLat: -17.8892,
      originLng: 31.2481,
      destAddress: "Harare CBD",
      destLat: -17.8292,
      destLng: 31.0522,
      cargoDescription: "Manufactured goods — electronics",
      requiredTonnes: 1,
      specialRequirements: ["FRAGILE"],
      askingPrice: 80,
      currency: "USD",
      status: "CANCELLED",
      searchRadiusKm: 25,
    },
  });

  await prisma.job.create({
    data: {
      shipperId: shipperProfile2.id,
      originAddress: "Msasa Industrial Park, Harare",
      originLat: -17.8678,
      originLng: 31.1244,
      destAddress: "Kariba Town",
      destLat: -16.5246,
      destLng: 28.8038,
      cargoDescription: "Industrial equipment",
      requiredTonnes: 30,
      specialRequirements: ["OVERSIZED", "HAZARDOUS"],
      askingPrice: 1200,
      currency: "USD",
      status: "IN_TRANSIT",
      searchRadiusKm: 25,
      matchedDriverId: drivers[2].driverProfile!.id,
    },
  });

  // ── Chat thread on the BIDDING job ──────────────────────────────────────────
  await prisma.message.createMany({
    data: [
      { jobId: biddingJob.id, senderId: shipper1.id, content: "Hi, is the cargo fragile at all?", isRead: true },
      { jobId: biddingJob.id, senderId: drivers[0].id, content: "No, it is standard building materials. I have experience with this route.", isRead: true },
      { jobId: biddingJob.id, senderId: shipper1.id, content: "Great. Can you do $390?", isRead: true },
      { jobId: biddingJob.id, senderId: drivers[0].id, content: "Yes, $390 works. I can pick up tomorrow morning.", isRead: false },
      { jobId: biddingJob.id, senderId: shipper1.id, content: "Perfect. Cargo will be ready at 7am.", isRead: false },
      { jobId: biddingJob.id, senderId: drivers[0].id, content: "See you at 7am!", isRead: false },
    ],
  });

  // ── AppConfig ────────────────────────────────────────────────────────────────
  let configSeeded = 0;
  for (const entry of CONFIG_SEED) {
    const existing = await prisma.appConfig.findUnique({ where: { key: entry.key } });
    if (!existing) {
      await prisma.appConfig.create({ data: entry });
      configSeeded++;
    }
  }

  // ── Admin user ───────────────────────────────────────────────────────────────
  const ADMIN_USERNAME = process.env.ADMIN_SEED_USERNAME ?? "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "changeme123";

  const existingAdmin = await prisma.admin.findUnique({ where: { username: ADMIN_USERNAME } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.admin.create({ data: { username: ADMIN_USERNAME, passwordHash } });
    console.log(`  Admin created: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
    console.log(`  !! Change the admin password after first login !!`);
  } else {
    console.log(`  Admin '${ADMIN_USERNAME}' already exists — skipped`);
  }

  console.log("Seed complete!");
  console.log(`  Shippers: 2 (Tendai Moyo, Rudo Chikwanda)`);
  console.log(`  Drivers: 8 (all APPROVED, MONTHLY subscription)`);
  console.log(`  Jobs: 6 (COMPLETED, BIDDING×2, MATCHED, IN_TRANSIT, CANCELLED)`);
  console.log(`  Bids: 4 on the BIDDING job`);
  console.log(`  Messages: 6 in the BIDDING job chat`);
  console.log(`  Ratings: 2 on the COMPLETED job`);
  console.log(`  Config entries seeded: ${configSeeded} / ${CONFIG_SEED.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
