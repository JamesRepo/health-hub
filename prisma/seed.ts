import { pathToFileURL } from "node:url";

import { loadEnvConfig } from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

export const ACTIVITY_TYPES = [
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
] as const;

type SeedActivityType = (typeof ACTIVITY_TYPES)[number];

type SeedPrismaClient = {
  activityType: {
    upsert(args: {
      where: { name: SeedActivityType["name"] };
      update: { emoji: SeedActivityType["emoji"] };
      create: {
        name: SeedActivityType["name"];
        emoji: SeedActivityType["emoji"];
      };
    }): Promise<unknown>;
  };
  $transaction(operations: Promise<unknown>[]): Promise<unknown>;
};

export async function seedActivityTypes(prisma: SeedPrismaClient) {
  await prisma.$transaction(
    ACTIVITY_TYPES.map((activityType) =>
      prisma.activityType.upsert({
        where: { name: activityType.name },
        update: { emoji: activityType.emoji },
        create: {
          name: activityType.name,
          emoji: activityType.emoji,
        },
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
    console.log(`Seeded ${ACTIVITY_TYPES.length} activity types.`);
  } catch (error) {
    console.error("Failed to seed activity types.", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  void main().catch((error) => {
    console.error("Failed to seed activity types.", error);
    process.exitCode = 1;
  });
}
