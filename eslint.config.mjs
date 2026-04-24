import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const ROUTE_HANDLER_EXPORTS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

function hasDirective(program, directive) {
  return program.body.some(
    (statement) =>
      statement.type === "ExpressionStatement" &&
      statement.directive === directive,
  );
}

function isPrismaClientModule(source) {
  return source === "@/lib/prisma" || source.endsWith("/lib/prisma");
}

function getExportedNames(statement) {
  const exportedNames = [];

  if (statement.declaration) {
    const declaration = statement.declaration;

    if (
      (declaration.type === "FunctionDeclaration" ||
        declaration.type === "ClassDeclaration" ||
        declaration.type === "TSDeclareFunction") &&
      declaration.id
    ) {
      exportedNames.push(declaration.id.name);
    }

    if (declaration.type === "VariableDeclaration") {
      for (const declarator of declaration.declarations) {
        if (declarator.id.type === "Identifier") {
          exportedNames.push(declarator.id.name);
        }
      }
    }
  }

  for (const specifier of statement.specifiers) {
    if (specifier.exported.type === "Identifier") {
      exportedNames.push(specifier.exported.name);
    }
  }

  return exportedNames;
}

const healthHubPlugin = {
  rules: {
    "require-use-server-directive": {
      meta: {
        type: "problem",
        docs: {
          description: "Require a `use server` directive in server action files.",
        },
        schema: [],
        messages: {
          missing:
            "Files in `actions/` must declare `\"use server\"` at the top level.",
        },
      },
      create(context) {
        return {
          Program(node) {
            if (!hasDirective(node, "use server")) {
              context.report({
                node,
                messageId: "missing",
              });
            }
          },
        };
      },
    },
    "no-prisma-in-client-components": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Prevent Prisma client access from client components.",
        },
        schema: [],
        messages: {
          prismaClient:
            "Client components must not import the Prisma client instance. Move database access to the server.",
          prismaValues:
            "Client components must not import runtime values from `@prisma/client`. Fetch data on the server and pass serializable props instead.",
        },
      },
      create(context) {
        return {
          Program(node) {
            if (!hasDirective(node, "use client")) {
              return;
            }

            for (const statement of node.body) {
              if (statement.type !== "ImportDeclaration") {
                continue;
              }

              const source = String(statement.source.value);

              if (isPrismaClientModule(source)) {
                context.report({
                  node: statement,
                  messageId: "prismaClient",
                });
                continue;
              }

              if (source !== "@prisma/client") {
                continue;
              }

              const hasValueImport =
                statement.importKind !== "type" &&
                statement.specifiers.some(
                  (specifier) =>
                    specifier.type !== "ImportSpecifier" ||
                    specifier.importKind !== "type",
                );

              if (hasValueImport) {
                context.report({
                  node: statement,
                  messageId: "prismaValues",
                });
              }
            }
          },
        };
      },
    },
    "require-route-handler-export": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Require Next.js route modules to export at least one HTTP handler.",
        },
        schema: [],
        messages: {
          missing:
            "Route modules must export at least one HTTP handler such as `GET` or `POST`.",
        },
      },
      create(context) {
        return {
          Program(node) {
            const hasHandler = node.body.some((statement) => {
              if (statement.type !== "ExportNamedDeclaration") {
                return false;
              }

              return getExportedNames(statement).some((name) =>
                ROUTE_HANDLER_EXPORTS.has(name),
              );
            });

            if (!hasHandler) {
              context.report({
                node,
                messageId: "missing",
              });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    plugins: {
      "health-hub": healthHubPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "moment",
              message: "Use `date-fns` for date handling in this project.",
            },
            {
              name: "next-auth",
              importNames: ["getServerSession"],
              message: "Use `auth()` from `@/lib/auth` with NextAuth v5.",
            },
            {
              name: "next-auth/next",
              importNames: ["getServerSession"],
              message: "Use `auth()` from `@/lib/auth` with NextAuth v5.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "health-hub/no-prisma-in-client-components": "error",
    },
  },
  {
    files: ["actions/**/*.{ts,tsx}"],
    rules: {
      "health-hub/require-use-server-directive": "error",
    },
  },
  {
    files: ["app/api/**/route.{ts,tsx}"],
    rules: {
      "health-hub/require-route-handler-export": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
