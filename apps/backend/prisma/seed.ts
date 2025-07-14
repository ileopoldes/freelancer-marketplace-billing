import { PrismaClient } from "@prisma/client";
import { createMoney, moneyToDecimalString } from "@marketplace/shared";

const prisma = new PrismaClient();

// Demo data configuration
const DEMO_ORGS_COUNT = 10;
const DEMO_ENTITIES_PER_ORG = 3;
const DEMO_USERS_COUNT = 20;
const USAGE_DAYS = 30; // Generate 1 month of usage data

// Seed Functions
async function seedOrganizations() {
  console.log("🏢 Seeding organizations...");

  const organizations = [];

  for (let i = 0; i < DEMO_ORGS_COUNT; i++) {
    const companyName = randomChoice(companies);
    organizations.push({
      name: companyName,
      billingEmail: `billing@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`
    });
  }

  await prisma.organization.createMany({ data: organizations });
  return await prisma.organization.findMany();
}

async function seedEntities(organizations) {
  console.log("🏬 Seeding entities...");

  for (const org of organizations) {
    const entities = [];
    for (let i = 0; i < DEMO_ENTITIES_PER_ORG; i++) {
      entities.push({
        organizationId: org.id,
        name: `Entity ${i + 1} of ${org.name}`
      });
    }
    await prisma.entity.createMany({ data: entities });
  }
}

async function seedUsers() {
  console.log("👤 Seeding users...");

  const users = [];

  for (let i = 0; i < DEMO_USERS_COUNT; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const email = generateEmail(firstName, lastName, "example.com");
    users.push({ name: `${firstName} ${lastName}`, email });
  }

  await prisma.user.createMany({ data: users });
  return await prisma.user.findMany();
}

// Sample company names and domains
const companies = [
  "TechCorp",
  "DataFlow Inc",
  "CloudSync",
  "APIFirst Ltd",
  "StreamlineHQ",
  "DevTools Pro",
  "ScaleUp Systems",
  "IntegrateNow",
  "AutomateIt",
  "ConnectAPI",
  "FlowState",
  "BuildFast",
  "CodeStream",
  "DataBridge",
  "ServiceMesh",
  "CloudNative",
  "MicroService",
  "EventStream",
  "BatchPro",
  "RealTime Systems",
  "EdgeCompute",
  "ProcessFlow",
  "WorkflowMax",
];

// Sample first and last names
const firstNames = [
  "Alex",
  "Jordan",
  "Taylor",
  "Casey",
  "Riley",
  "Morgan",
  "Avery",
  "Quinn",
  "Drew",
  "Blake",
  "Cameron",
  "Dakota",
  "Emery",
  "Finley",
  "Harper",
  "Indigo",
  "Jaden",
  "Kendall",
  "Logan",
  "Marley",
  "Nico",
  "Parker",
  "River",
  "Sage",
  "Tatum",
  "Val",
  "Winter",
  "Zion",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
];

// Utility functions
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateEmail(
  firstName: string,
  lastName: string,
  company: string,
): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateUsagePattern(): number[] {
  // Generate realistic daily usage patterns
  const baseUsage = randomInt(100, 5000);
  const pattern = [];

  for (let i = 0; i < USAGE_DAYS; i++) {
    // Simulate business days vs weekends
    const dayOfWeek = i % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let dailyUsage;
    if (isWeekend) {
      // Lower usage on weekends
      dailyUsage = Math.floor(baseUsage * randomFloat(0.1, 0.3));
    } else {
      // Normal business day usage with some variation
      dailyUsage = Math.floor(baseUsage * randomFloat(0.8, 1.5));
    }

    // Add some spikes (10% chance of high usage day)
    if (Math.random() < 0.1) {
      dailyUsage = Math.floor(dailyUsage * randomFloat(3, 8));
    }

    pattern.push(Math.max(0, dailyUsage));
  }

  return pattern;
}

async function seedPriceBooks() {
  console.log("🏷️  Seeding price books...");

  const priceBooks = [
    {
      name: "Basic Plan",
      description: "Perfect for small teams and startups",
      baseFee: moneyToDecimalString(createMoney("99.00")),
      tier1Limit: 1000,
      tier1Price: moneyToDecimalString(createMoney("0")),
      tier2Limit: 1000000,
      tier2Price: moneyToDecimalString(createMoney("0.002")),
      tier3Price: moneyToDecimalString(createMoney("0.001")),
      minCommit: 10000,
      minCommitFee: moneyToDecimalString(createMoney("20.00")),
    },
    {
      name: "Pro Plan",
      description: "For growing businesses with higher usage",
      baseFee: moneyToDecimalString(createMoney("199.00")),
      tier1Limit: 5000,
      tier1Price: moneyToDecimalString(createMoney("0")),
      tier2Limit: 2000000,
      tier2Price: moneyToDecimalString(createMoney("0.0015")),
      tier3Price: moneyToDecimalString(createMoney("0.0008")),
      minCommit: 25000,
      minCommitFee: moneyToDecimalString(createMoney("37.50")),
    },
    {
      name: "Enterprise Plan",
      description: "Custom pricing for large organizations",
      baseFee: moneyToDecimalString(createMoney("499.00")),
      tier1Limit: 10000,
      tier1Price: moneyToDecimalString(createMoney("0")),
      tier2Limit: 5000000,
      tier2Price: moneyToDecimalString(createMoney("0.001")),
      tier3Price: moneyToDecimalString(createMoney("0.0005")),
      minCommit: 100000,
      minCommitFee: moneyToDecimalString(createMoney("100.00")),
    },
  ];

  for (const priceBook of priceBooks) {
    // await prisma.priceBook.create({ data: priceBook });
  }

  console.log(`   Created ${priceBooks.length} price books`);
}

async function seedCustomers() {
  console.log("👥 Seeding customers...");

  const customers = [];

  for (let i = 0; i < DEMO_CUSTOMERS_COUNT; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const company = randomChoice(companies);
    const email = generateEmail(firstName, lastName, company);

    // Some customers have credit balances
    const hasCreditBalance = Math.random() < 0.2; // 20% chance
    const creditBalance = hasCreditBalance
      ? moneyToDecimalString(createMoney(randomFloat(10, 500).toFixed(2)))
      : moneyToDecimalString(createMoney("0"));

    customers.push({
      name: `${firstName} ${lastName}`,
      email,
      company,
      address: `${randomInt(100, 9999)} ${randomChoice(["Main St", "Oak Ave", "Pine Rd", "First Ave", "Second St"])}`,
      taxId: Math.random() < 0.7 ? `TAX${randomInt(100000, 999999)}` : null,
      creditBalance,
      timezone: randomChoice([
        "UTC",
        "America/New_York",
        "America/Los_Angeles",
        "Europe/London",
      ]),
    });
  }

  const createdCustomers = await prisma.customer.createMany({
    data: customers,
  });

  console.log(`   Created ${createdCustomers.count} customers`);
  return await prisma.customer.findMany();
}

async function seedContracts(customers: any[]) {
  console.log("📄 Seeding contracts...");

  const priceBooks = await prisma.priceBook.findMany();
  const contracts = [];

  for (const customer of customers) {
    // Each customer gets one contract
    const priceBook = randomChoice(priceBooks);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - randomInt(0, 6)); // Started 0-6 months ago

    // 90% of contracts are active
    const status =
      Math.random() < 0.9 ? "ACTIVE" : randomChoice(["PAUSED", "CANCELED"]);

    // Calculate next billing date - for demo purposes, make some contracts due for billing
    const nextBillingDate = new Date();
    if (Math.random() < 0.3) {
      // 30% of contracts are due for billing now (overdue)
      nextBillingDate.setDate(nextBillingDate.getDate() - randomInt(0, 5));
    } else {
      // Others are due in the future
      nextBillingDate.setDate(nextBillingDate.getDate() + randomInt(1, 30));
    }

    // Set billing cycle based on contract age
    const monthsActive = Math.floor(
      (new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    const billingCycle = Math.max(1, monthsActive + 1);

    contracts.push({
      customerId: customer.id,
      startDate,
      endDate: null, // Open-ended contracts
      status: status as any,
      baseFee: priceBook.baseFee,
      minCommitCalls: priceBook.minCommit,
      callOverageFee: priceBook.tier2Price, // Use tier 2 price for overage
      discountRate: moneyToDecimalString(createMoney("0.2")), // 20% discount
      nextBillingDate,
      billingCycle,
      recurrenceRule: "FREQ=MONTHLY;BYMONTHDAY=1", // Bill on 1st of month
    });
  }

  const createdContracts = await prisma.contract.createMany({
    data: contracts,
  });

  console.log(`   Created ${createdContracts.count} contracts`);
  return await prisma.contract.findMany({ include: { customer: true } });
}

async function seedUsageEvents(contracts: any[]) {
  console.log("📊 Seeding usage events...");

  let totalEvents = 0;

  for (const contract of contracts) {
    if (contract.status !== "ACTIVE") continue; // Only generate usage for active contracts

    const usagePattern = generateUsagePattern();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - USAGE_DAYS);

    for (let day = 0; day < USAGE_DAYS; day++) {
      const dailyUsage = usagePattern[day];
      if (dailyUsage === 0) continue;

      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + day);

      // Create multiple events throughout the day
      const eventsPerDay = Math.min(
        100,
        Math.max(1, Math.floor(dailyUsage / 10)),
      );
      const callsPerEvent = Math.floor(dailyUsage / eventsPerDay);
      const remainingCalls = dailyUsage % eventsPerDay;

      for (let event = 0; event < eventsPerDay; event++) {
        const eventTime = new Date(eventDate);
        eventTime.setHours(
          randomInt(0, 23),
          randomInt(0, 59),
          randomInt(0, 59),
        );

        const quantity = callsPerEvent + (event < remainingCalls ? 1 : 0);

        await prisma.usageEvent.create({
          data: {
            customerId: contract.customerId,
            contractId: contract.id,
            eventType: "api_call",
            quantity,
            timestamp: eventTime,
            metadata: {
              source: randomChoice(["web", "mobile", "api", "integration"]),
              endpoint: randomChoice([
                "/api/v1/users",
                "/api/v1/data",
                "/api/v1/analytics",
                "/api/v1/reports",
              ]),
            },
          },
        });

        totalEvents++;
      }
    }
  }

  console.log(`   Created ${totalEvents} usage events`);
}

async function seedCredits(customers: any[]) {
  console.log("💳 Seeding credits...");

  const credits = [];

  // Give 30% of customers some manual credits
  const customersWithCredits = customers
    .filter(() => Math.random() < 0.3)
    .slice(0, 15); // Limit to 15 customers

  for (const customer of customersWithCredits) {
    const creditTypes = ["MANUAL", "REFUND", "PROMOTIONAL"];
    const creditType = randomChoice(creditTypes);
    const amount = randomFloat(10, 100);

    credits.push({
      customerId: customer.id,
      amount: moneyToDecimalString(createMoney(amount.toFixed(2))),
      description: `${creditType} credit - Customer service adjustment`,
      type: creditType as any,
      appliedAt: Math.random() < 0.7 ? new Date() : null, // 70% applied, 30% pending
    });
  }

  if (credits.length > 0) {
    const createdCredits = await prisma.credit.createMany({
      data: credits,
    });
    console.log(`   Created ${createdCredits.count} credits`);
  }
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.entityUser.deleteMany();
    await prisma.marketplaceEvent.deleteMany();
    await prisma.entityCreditBalance.deleteMany();
    await prisma.entitySubscription.deleteMany();
    await prisma.team.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    // Seed data in order
    const orgs = await seedOrganizations();
    await seedEntities(orgs);
    const users = await seedUsers();

    // Summary
    console.log("\n📈 Seed Summary:");
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.entity.count(),
      prisma.user.count(),
    ]);

    console.log(`   Organizations: ${counts[0]}`);
    console.log(`   Entities: ${counts[1]}`);
    console.log(`   Users: ${counts[2]}`);

    console.log("\n✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
