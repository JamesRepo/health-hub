"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const exerciseSchema = z.object({
  activityTypeId: z.number().int().positive(),
  slotNumber: z.number().int().min(1).max(4),
});

const saveEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(1).max(3).nullable(),
  sleepQuality: z.number().int().min(1).max(3).nullable(),
  alcoholUnits: z.number().int().min(0).nullable(),
  sexActivity: z.string().max(20).nullable(),
  totalExerciseSeconds: z.number().int().min(0).nullable(),
  stepCount: z.number().int().min(0).nullable(),
  didStretch: z.boolean(),
  notes: z.string().max(1000).nullable(),
  exercises: z.array(exerciseSchema).max(4),
});

export type SaveEntryInput = z.infer<typeof saveEntrySchema>;

export async function saveEntry(input: SaveEntryInput) {
  const session = await auth();
  if (!session) {
    return { error: "Not authenticated." };
  }

  const parsed = saveEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { date, exercises, ...fields } = parsed.data;
  const logDate = new Date(date + "T00:00:00");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.dailyLog.upsert({
        where: { logDate },
        create: { logDate, ...fields },
        update: fields,
      });

      // Delete existing exercise entries and re-create
      await tx.exerciseEntry.deleteMany({
        where: { dailyLogId: log.id },
      });

      if (exercises.length > 0) {
        await tx.exerciseEntry.createMany({
          data: exercises.map((ex) => ({
            dailyLogId: log.id,
            activityTypeId: ex.activityTypeId,
            slotNumber: ex.slotNumber,
          })),
        });
      }

      return log;
    });

    revalidatePath("/entry");
    revalidatePath(`/entry/${date}`);
    revalidatePath("/history");

    return { success: true, id: result.id };
  } catch (e) {
    console.error("Failed to save daily log:", e);
    return { error: "Failed to save entry. Please try again." };
  }
}
