import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const envFileCandidates = [".env.local", ".env"];

function parseEnvFile(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }

  return values;
}

async function loadEnvironment() {
  const merged = { ...process.env };

  for (const fileName of envFileCandidates) {
    const filePath = path.join(rootDir, fileName);

    try {
      const contents = await fs.readFile(filePath, "utf8");
      Object.assign(merged, parseEnvFile(contents), process.env);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }

  return merged;
}

function hasValue(environment, key) {
  return Boolean(environment[key]?.trim());
}

function printStatus(label, ok, detail) {
  console.log(`${ok ? "[ok]" : "[missing]"} ${label}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const environment = await loadEnvironment();
  const supabaseConfigured =
    hasValue(environment, "NEXT_PUBLIC_SUPABASE_URL") &&
    hasValue(environment, "NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    hasValue(environment, "SUPABASE_SERVICE_ROLE_KEY");
  const explicitDemoMode = environment.NEXT_PUBLIC_DEMO_MODE?.trim();
  const demoMode =
    explicitDemoMode === "true" ||
    (explicitDemoMode !== "false" && !supabaseConfigured);
  const appUrl = environment.NEXT_PUBLIC_APP_URL?.trim() || "";
  const shopifyConfigured =
    hasValue(environment, "SHOPIFY_API_KEY") &&
    hasValue(environment, "SHOPIFY_API_SECRET") &&
    hasValue(environment, "SHOPIFY_TOKEN_ENCRYPTION_KEY") &&
    supabaseConfigured;

  console.log("Affinity runtime config check");
  console.log("============================");
  console.log(`Mode: ${demoMode ? "demo/local fallback" : "live/Supabase-backed"}`);
  console.log(`App URL: ${appUrl || "(missing)"}`);
  console.log("");

  printStatus("NEXT_PUBLIC_APP_URL", hasValue(environment, "NEXT_PUBLIC_APP_URL"));
  printStatus("NEXT_PUBLIC_SUPABASE_URL", hasValue(environment, "NEXT_PUBLIC_SUPABASE_URL"));
  printStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY", hasValue(environment, "NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  printStatus("SUPABASE_SERVICE_ROLE_KEY", hasValue(environment, "SUPABASE_SERVICE_ROLE_KEY"));
  console.log("");
  printStatus("SHOPIFY_API_KEY", hasValue(environment, "SHOPIFY_API_KEY"));
  printStatus("SHOPIFY_API_SECRET", hasValue(environment, "SHOPIFY_API_SECRET"));
  printStatus(
    "SHOPIFY_TOKEN_ENCRYPTION_KEY",
    hasValue(environment, "SHOPIFY_TOKEN_ENCRYPTION_KEY"),
  );
  printStatus(
    "SHOPIFY_WEBHOOK_SECRET",
    hasValue(environment, "SHOPIFY_WEBHOOK_SECRET"),
    hasValue(environment, "SHOPIFY_WEBHOOK_SECRET")
      ? "override attivo"
      : "opzionale, fallback su SHOPIFY_API_SECRET",
  );
  console.log("");
  console.log(
    `Supabase runtime ready: ${supabaseConfigured ? "yes" : "no"}${demoMode ? " (demo fallback disponibile)" : ""}`,
  );
  console.log(`Shopify live bridge ready: ${shopifyConfigured ? "yes" : "no"}`);

  if (environment.SHOPIFY_APP_EMBEDDED?.trim() === "true") {
    console.warn(
      "Warning: SHOPIFY_APP_EMBEDDED=true ma il repository attuale non include App Bridge/session token. Mantieni embedded=false finche non introduci quel layer.",
    );
  }

  if (!supabaseConfigured && explicitDemoMode === "false") {
    console.warn(
      "Warning: NEXT_PUBLIC_DEMO_MODE=false ma Supabase non e completo. Il runtime live non potra avviarsi correttamente.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
