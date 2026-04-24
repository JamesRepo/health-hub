import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const ACTIVITY_TYPES = [
  { name: "Run", emoji: "🏃" },
  { name: "Gym", emoji: "🏋️" },
  { name: "Football", emoji: "⚽" },
  { name: "Core", emoji: "🧘" },
  { name: "Swim", emoji: "🏊" },
  { name: "Cycle", emoji: "🚴" },
  { name: "Hike", emoji: "🥾" },
  { name: "Walk", emoji: "🚶" },
  { name: "Yoga", emoji: "🧘‍♂️" },
  { name: "Pilates", emoji: "🤸" },
  { name: "Golf", emoji: "⛳" },
  { name: "Tennis", emoji: "🎾" },
];

export async function seedActivityTypes(prisma) {
  await prisma.$transaction(
    ACTIVITY_TYPES.map((activityType) =>
      prisma.activityType.upsert({
        where: { name: activityType.name },
        update: { emoji: activityType.emoji },
        create: activityType,
      }),
    ),
  );
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedActivityTypes(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed activity types.", error);
  process.exitCode = 1;
});
