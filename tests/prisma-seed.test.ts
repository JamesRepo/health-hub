import assert from "node:assert/strict";
import test from "node:test";

import { ACTIVITY_TYPES, seedActivityTypes } from "../prisma/seed";

test("seed activity types cover the planned exercise catalog", () => {
  assert.equal(ACTIVITY_TYPES.length, 20);

  assert.deepEqual(
    ACTIVITY_TYPES.map((activityType) => activityType.name),
    [
      "Run",
      "Gym",
      "Football",
      "Core",
      "Swim",
      "Cycle",
      "Hike",
      "Walk",
      "Yoga",
      "Pilates",
      "Golf",
      "Tennis",
      "Basketball",
      "Boxing",
      "Climbing",
      "Dance",
      "Rowing",
      "Ski",
      "Stretch",
      "Other",
    ],
  );
});

test("seed activity types preserve requested emoji values", () => {
  const activityEmojiByName = new Map(
    ACTIVITY_TYPES.map((activityType) => [activityType.name, activityType.emoji]),
  );

  assert.equal(activityEmojiByName.get("Gym"), "💪");
  assert.equal(activityEmojiByName.get("Yoga"), "🧘‍♀️");
  assert.equal(activityEmojiByName.get("Stretch"), null);
  assert.equal(activityEmojiByName.get("Other"), null);
});

test("seedActivityTypes upserts every configured activity by name", async () => {
  const upsertCalls: {
    where: { name: string };
    update: { emoji: string | null };
    create: { name: string; emoji: string | null };
  }[] = [];

  const prisma = {
    activityType: {
      upsert(args: (typeof upsertCalls)[number]) {
        upsertCalls.push(args);
        return Promise.resolve(args);
      },
    },
    $transaction(operations: Promise<unknown>[]) {
      return Promise.all(operations);
    },
  };

  await seedActivityTypes(prisma);

  assert.equal(upsertCalls.length, ACTIVITY_TYPES.length);
  assert.deepEqual(
    upsertCalls.map((call) => call.where.name),
    ACTIVITY_TYPES.map((activityType) => activityType.name),
  );
  assert.deepEqual(
    upsertCalls[0],
    {
      where: { name: "Run" },
      update: { emoji: "🏃" },
      create: { name: "Run", emoji: "🏃" },
    },
  );
});
