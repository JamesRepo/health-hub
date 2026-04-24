import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const migrationPath =
  new URL("../prisma/migrations/20260424200341_init/migration.sql", import.meta.url);
const schemaPath = new URL("../prisma/schema.prisma", import.meta.url);

function loadFixture(path) {
  return readFileSync(path, "utf8");
}

test("initial migration creates the health_hub schema before tables", () => {
  const migration = loadFixture(migrationPath);
  const schemaIndex = migration.indexOf('CREATE SCHEMA IF NOT EXISTS "health_hub";');
  const firstTableIndex = migration.indexOf("CREATE TABLE");

  assert.notEqual(schemaIndex, -1, "migration must create the health_hub schema");
  assert.notEqual(firstTableIndex, -1, "migration must create tables");
  assert.ok(
    schemaIndex < firstTableIndex,
    "schema creation must happen before any table creation",
  );
});

test("schema diff from empty includes health_hub schema creation", () => {
  const output = execFileSync(
    "npx",
    ["prisma", "migrate", "diff", "--from-empty", "--to-schema", schemaPath.pathname, "--script"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
    },
  );

  assert.match(
    output,
    /CREATE SCHEMA IF NOT EXISTS "health_hub";/,
    "prisma schema diff should bootstrap the health_hub schema",
  );
});
