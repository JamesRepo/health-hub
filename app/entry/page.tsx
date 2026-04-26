import { format } from "date-fns";

import { getEntry, getActivityTypes, getLatestGarminSync } from "@/lib/daily-log";
import { EntryForm } from "@/components/entry-form";

export default async function DailyEntryPage() {
  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");

  const [entry, activities, garminSync] = await Promise.all([
    getEntry(dateStr),
    getActivityTypes(),
    getLatestGarminSync(),
  ]);

  return (
    <div className="p-4 md:p-8">
      <EntryForm
        initialDate={today}
        entry={entry}
        activities={activities}
        garminSyncedAt={garminSync?.createdAt ?? null}
      />
    </div>
  );
}
