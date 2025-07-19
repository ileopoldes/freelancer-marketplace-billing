import { PrismaClient } from "@prisma/client";
import { createMoney, moneyToDecimalString } from "@marketplace/shared";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Demo data configuration
const DEMO_ORGS_COUNT = 3;
const DEMO_ENTITIES_PER_ORG = 2;
const DEMO_USERS_COUNT = 10;
const DEMO_TEAMS_PER_ENTITY = 2;
const DEMO_USERS_PER_ENTITY = 3;

// Seed Functions
async function seedOrganizations() {
  console.log("🏢 Seeding organizations...");

  const organizations = [];

  for (let i = 0; i < DEMO_ORGS_COUNT; i++) {
    const companyName = randomChoice(companies);
    organizations.push({
      name: companyName,
      billingEmail: `billing@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    });
  }

  await prisma.organization.createMany({ data: organizations });
  return await prisma.organization.findMany();
}

async function seedEntities(organizations) {
  console.log("🏬 Seeding entities...");

  const billingModels = ["PAY_AS_YOU_GO", "PREPAID_CREDITS", "SEAT_BASED"];

  for (const org of organizations) {
    const entities = [];
    for (let i = 0; i < DEMO_ENTITIES_PER_ORG; i++) {
      entities.push({
        organizationId: org.id,
        name: `Entity ${i + 1} of ${org.name}`,
        description: `Entity ${i + 1} for ${org.name}`,
        billingModel: randomChoice(billingModels),
      });
    }
    await prisma.entity.createMany({ data: entities });
  }
}

async function seedUsers() {
  console.log("👤 Seeding users...");

  // Default password for all demo users
  const defaultPassword = "demo123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const users = [
    {
      id: "system",
      name: "System",
      username: "system",
      email: "system@marketplace.com",
      password: hashedPassword,
      globalRole: "ADMIN",
    },
    // Add some specific demo users with known credentials
    {
      name: "Admin User",
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      globalRole: "ADMIN",
    },
    {
      name: "Regular User",
      username: "user",
      email: "user@example.com",
      password: hashedPassword,
      globalRole: "USER",
    },
    {
      name: "Freelancer Demo",
      username: "freelancer",
      email: "freelancer@example.com",
      password: hashedPassword,
      globalRole: "FREELANCER",
    },
  ];

  const roles = ["ADMIN", "USER", "FREELANCER", "TEAM_LEAD"];

  for (let i = 0; i < DEMO_USERS_COUNT; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const email = generateEmail(firstName, lastName, "example.com");
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;

    users.push({
      name: `${firstName} ${lastName}`,
      username,
      email,
      password: hashedPassword,
      globalRole: randomChoice(roles),
    });
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

async function seedTeams(entities: any[]) {
  console.log("👥 Seeding teams...");

  for (const entity of entities) {
    const teams = [];
    for (let i = 0; i < DEMO_TEAMS_PER_ENTITY; i++) {
      teams.push({
        entityId: entity.id,
        name: `Team ${i + 1}`,
        description: `Team ${i + 1} for ${entity.name}`,
      });
    }
    await prisma.team.createMany({ data: teams });
  }
}

async function seedEntityUsers(entities: any[], users: any[]) {
  console.log("🔗 Seeding entity users...");

  for (const entity of entities) {
    const entityUsers = [];
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, DEMO_USERS_PER_ENTITY);

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      entityUsers.push({
        entityId: entity.id,
        userId: user.id,
        role: i === 0 ? "ADMIN" : randomChoice(["MEMBER", "BILLING_MANAGER"]),
        creditLimit: moneyToDecimalString(
          createMoney(randomFloat(100, 1000).toFixed(2)),
        ),
        seatAllocation: randomInt(1, 3),
      });
    }
    await prisma.entityUser.createMany({ data: entityUsers });
  }
}

async function seedCreditPackages() {
  console.log("💳 Seeding credit packages...");

  const creditPackages = [
    {
      name: "Starter Package",
      creditsAmount: moneyToDecimalString(createMoney("100.00")),
      price: moneyToDecimalString(createMoney("95.00")),
      description: "Perfect for small projects",
    },
    {
      name: "Professional Package",
      creditsAmount: moneyToDecimalString(createMoney("500.00")),
      price: moneyToDecimalString(createMoney("450.00")),
      description: "Great for growing businesses",
    },
    {
      name: "Enterprise Package",
      creditsAmount: moneyToDecimalString(createMoney("2000.00")),
      price: moneyToDecimalString(createMoney("1800.00")),
      description: "For large organizations",
    },
  ];

  await prisma.creditPackage.createMany({ data: creditPackages });
  console.log(`   Created ${creditPackages.length} credit packages`);
}

async function seedEntityCreditBalances(entities: any[]) {
  console.log("💰 Seeding entity credit balances...");

  const balances = [];
  for (const entity of entities) {
    const totalCredits = randomFloat(50, 500);
    const usedCredits = randomFloat(0, totalCredits * 0.7);

    balances.push({
      entityId: entity.id,
      totalCredits: moneyToDecimalString(createMoney(totalCredits.toFixed(2))),
      usedCredits: moneyToDecimalString(createMoney(usedCredits.toFixed(2))),
    });
  }

  await prisma.entityCreditBalance.createMany({ data: balances });
  console.log(`   Created ${balances.length} credit balances`);
}

async function seedEntitySubscriptions(entities: any[]) {
  console.log("💺 Seeding entity subscriptions...");

  const subscriptions = [];
  for (const entity of entities) {
    // Only some entities have subscriptions
    if (Math.random() < 0.6) {
      const seatCount = randomInt(5, 50);
      const monthlyPrice = seatCount * 25; // $25 per seat per month
      const annualPrice = monthlyPrice * 10; // 2 months discount

      subscriptions.push({
        entityId: entity.id,
        subscriptionType: "STANDARD",
        seatCount,
        monthlyPrice: moneyToDecimalString(
          createMoney(monthlyPrice.toFixed(2)),
        ),
        annualPrice: moneyToDecimalString(createMoney(annualPrice.toFixed(2))),
        billingCycle: randomChoice(["MONTHLY", "ANNUAL"]),
        nextBillingDate: new Date(
          Date.now() + randomInt(1, 30) * 24 * 60 * 60 * 1000,
        ),
      });
    }
  }

  if (subscriptions.length > 0) {
    await prisma.entitySubscription.createMany({ data: subscriptions });
    console.log(`   Created ${subscriptions.length} subscriptions`);
  }
}

async function seedMarketplaceEvents(entities: any[], users: any[]) {
  console.log("📊 Seeding marketplace events...");

  const events = [];
  const eventTypes = [
    "PROJECT_POSTED",
    "FREELANCER_HIRED",
    "MILESTONE_COMPLETED",
  ];
  const unitPrices = {
    PROJECT_POSTED: 5.0,
    FREELANCER_HIRED: 15.0,
    MILESTONE_COMPLETED: 2.5,
  };

  for (const entity of entities) {
    const entityUsers = users.filter(() => Math.random() < 0.3); // Some users per entity

    if (entityUsers.length > 0) {
      for (let i = 0; i < randomInt(5, 20); i++) {
        const eventType = randomChoice(eventTypes);
        const user = randomChoice(entityUsers);
        const quantity = randomInt(1, 3);
        const unitPrice = unitPrices[eventType];

        events.push({
          entityId: entity.id,
          userId: user.id,
          eventType,
          quantity,
          unitPrice: moneyToDecimalString(createMoney(unitPrice.toFixed(2))),
          timestamp: new Date(
            Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000,
          ),
          metadata: {
            source: randomChoice(["web", "mobile", "api"]),
            projectId: `proj_${randomInt(1000, 9999)}`,
          },
        });
      }
    }
  }

  if (events.length > 0) {
    await prisma.marketplaceEvent.createMany({ data: events });
    console.log(`   Created ${events.length} marketplace events`);
  }
}

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.walletTransaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.projectContract.deleteMany();
    await prisma.project.deleteMany();
    await prisma.entityUser.deleteMany();
    await prisma.marketplaceEvent.deleteMany();
    await prisma.entityCreditBalance.deleteMany();
    await prisma.entitySubscription.deleteMany();
    await prisma.creditPackage.deleteMany();
    await prisma.team.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    // Seed data in order
    const orgs = await seedOrganizations();
    await seedEntities(orgs);
    const users = await seedUsers();

    // Get all entities for further seeding
    const entities = await prisma.entity.findMany();

    // Seed relationships and additional data
    await seedTeams(entities);
    await seedEntityUsers(entities, users);
    await seedCreditPackages();
    await seedEntityCreditBalances(entities);
    await seedEntitySubscriptions(entities);
    await seedMarketplaceEvents(entities, users);

    // Summary
    console.log("\n📈 Seed Summary:");
    const counts = await Promise.all([
      prisma.organization.count(),
      prisma.entity.count(),
      prisma.user.count(),
      prisma.team.count(),
      prisma.entityUser.count(),
      prisma.creditPackage.count(),
      prisma.entityCreditBalance.count(),
      prisma.entitySubscription.count(),
      prisma.marketplaceEvent.count(),
    ]);

    console.log(`   Organizations: ${counts[0]}`);
    console.log(`   Entities: ${counts[1]}`);
    console.log(`   Users: ${counts[2]}`);
    console.log(`   Teams: ${counts[3]}`);
    console.log(`   Entity Users: ${counts[4]}`);
    console.log(`   Credit Packages: ${counts[5]}`);
    console.log(`   Credit Balances: ${counts[6]}`);
    console.log(`   Subscriptions: ${counts[7]}`);
    console.log(`   Marketplace Events: ${counts[8]}`);

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
