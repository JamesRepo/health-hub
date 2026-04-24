-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "health_hub";

-- CreateTable
CREATE TABLE "activity_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "emoji" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_log" (
    "id" SERIAL NOT NULL,
    "log_date" DATE NOT NULL,
    "mood" SMALLINT,
    "sleep_quality" SMALLINT,
    "alcohol_units" SMALLINT,
    "sex_activity" VARCHAR(20),
    "total_exercise_seconds" INTEGER,
    "step_count" INTEGER,
    "did_stretch" BOOLEAN NOT NULL DEFAULT false,
    "garmin_sleep_score" INTEGER,
    "garmin_sleep_seconds" INTEGER,
    "garmin_deep_seconds" INTEGER,
    "garmin_light_seconds" INTEGER,
    "garmin_rem_seconds" INTEGER,
    "garmin_awake_seconds" INTEGER,
    "garmin_resting_hr" INTEGER,
    "garmin_stress_avg" INTEGER,
    "garmin_body_battery" INTEGER,
    "garmin_hrv_status" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_entry" (
    "id" SERIAL NOT NULL,
    "daily_log_id" INTEGER NOT NULL,
    "activity_type_id" INTEGER NOT NULL,
    "slot_number" SMALLINT NOT NULL,
    "duration_seconds" INTEGER,
    "notes" TEXT,

    CONSTRAINT "exercise_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_tag" (
    "id" SERIAL NOT NULL,
    "daily_log_id" INTEGER NOT NULL,
    "tag" VARCHAR(50) NOT NULL,

    CONSTRAINT "daily_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_metric" (
    "id" SERIAL NOT NULL,
    "daily_log_id" INTEGER NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" DECIMAL(65,30),
    "metric_text" TEXT,

    CONSTRAINT "custom_metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_digest" (
    "id" SERIAL NOT NULL,
    "period_type" VARCHAR(20) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "highlights" JSONB,
    "model" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomaly" (
    "id" SERIAL NOT NULL,
    "detected_at" DATE NOT NULL,
    "metric" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "value" DECIMAL(65,30),
    "baseline" DECIMAL(65,30),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garmin_sync" (
    "id" SERIAL NOT NULL,
    "sync_date" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "sleep_sync" BOOLEAN NOT NULL DEFAULT false,
    "steps_sync" BOOLEAN NOT NULL DEFAULT false,
    "act_sync" BOOLEAN NOT NULL DEFAULT false,
    "metrics_sync" BOOLEAN NOT NULL DEFAULT false,
    "errors" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garmin_sync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_type_name_key" ON "activity_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_log_log_date_key" ON "daily_log"("log_date");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_entry_daily_log_id_slot_number_key" ON "exercise_entry"("daily_log_id", "slot_number");

-- CreateIndex
CREATE UNIQUE INDEX "daily_tag_daily_log_id_tag_key" ON "daily_tag"("daily_log_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "custom_metric_daily_log_id_metric_name_key" ON "custom_metric"("daily_log_id", "metric_name");

-- CreateIndex
CREATE UNIQUE INDEX "ai_digest_period_type_period_start_key" ON "ai_digest"("period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "garmin_sync_sync_date_key" ON "garmin_sync"("sync_date");

-- AddForeignKey
ALTER TABLE "exercise_entry" ADD CONSTRAINT "exercise_entry_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "daily_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_entry" ADD CONSTRAINT "exercise_entry_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tag" ADD CONSTRAINT "daily_tag_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "daily_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_metric" ADD CONSTRAINT "custom_metric_daily_log_id_fkey" FOREIGN KEY ("daily_log_id") REFERENCES "daily_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;
