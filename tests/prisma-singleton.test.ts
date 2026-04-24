import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const prismaModulePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../lib/prisma.ts",
);
const prismaModuleSource = readFileSync(prismaModulePath, "utf8");
const env = process.env as NodeJS.ProcessEnv & {
  NODE_ENV?: string;
  DATABASE_URL?: string;
};
const testDatabaseUrl =
  "postgresql://health_hub:health_hub@localhost:5432/health_hub?schema=health_hub";

function createModuleCopies() {
  const tempDir = mkdtempSync(resolve(process.cwd(), ".tmp-health-hub-prisma-"));
  const firstModulePath = resolve(tempDir, "prisma-first.ts");
  const secondModulePath = resolve(tempDir, "prisma-second.ts");

  writeFileSync(firstModulePath, prismaModuleSource);
  writeFileSync(secondModulePath, prismaModuleSource);

  return {
    firstModuleUrl: pathToFileURL(firstModulePath).href,
    secondModuleUrl: pathToFileURL(secondModulePath).href,
    cleanup() {
      rmSync(tempDir, { force: true, recursive: true });
    },
  };
}

test("prisma reuses the global singleton in development", async (t) => {
  const originalNodeEnv = env.NODE_ENV;
  const originalDatabaseUrl = env.DATABASE_URL;
  const moduleCopies = createModuleCopies();

  delete globalThis.prisma;
  t.after(() => {
    moduleCopies.cleanup();
    delete globalThis.prisma;
    env.NODE_ENV = originalNodeEnv;
    env.DATABASE_URL = originalDatabaseUrl;
  });

  env.NODE_ENV = "development";
  env.DATABASE_URL = testDatabaseUrl;

  const firstModule = await import(moduleCopies.firstModuleUrl);
  const secondModule = await import(moduleCopies.secondModuleUrl);

  assert.equal(firstModule.default, firstModule.prisma);
  assert.equal(globalThis.prisma, firstModule.prisma);
  assert.equal(secondModule.prisma, firstModule.prisma);
});

test("prisma creates a fresh client per module load in production", async (t) => {
  const originalNodeEnv = env.NODE_ENV;
  const originalDatabaseUrl = env.DATABASE_URL;
  const moduleCopies = createModuleCopies();

  delete globalThis.prisma;
  t.after(() => {
    moduleCopies.cleanup();
    delete globalThis.prisma;
    env.NODE_ENV = originalNodeEnv;
    env.DATABASE_URL = originalDatabaseUrl;
  });

  env.NODE_ENV = "production";
  env.DATABASE_URL = testDatabaseUrl;

  const firstModule = await import(moduleCopies.firstModuleUrl);
  const secondModule = await import(moduleCopies.secondModuleUrl);

  assert.equal(firstModule.default, firstModule.prisma);
  assert.equal(globalThis.prisma, undefined);
  assert.notEqual(secondModule.prisma, firstModule.prisma);
});
