import { parse, isValid } from "date-fns";
import { notFound } from "next/navigation";

import { getEntry, getActivityTypes, getLatestGarminSync } from "@/lib/daily-log";
import { EntryForm } from "@/components/entry-form";

export default async function EntryDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date: dateStr } = await params;
  const parsed = parse(dateStr, "yyyy-MM-dd", new Date());

  if (!isValid(parsed)) {
    notFound();
  }

  const [entry, activities, garminSync] = await Promise.all([
    getEntry(dateStr),
    getActivityTypes(),
    getLatestGarminSync(),
  ]);

  return (
    <div className="p-4 md:p-8">
      <EntryForm
        initialDate={parsed}
        entry={entry}
        activities={activities}
        garminSyncedAt={garminSync?.createdAt ?? null}
      />
    </div>
  );
}
