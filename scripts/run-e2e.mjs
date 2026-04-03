import { spawn } from "node:child_process";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const storefrontURL =
  process.env.E2E_STOREFRONT_URL ?? "https://elevianutrition.eu";

const childEnv = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: baseURL,
  NEXT_PUBLIC_DEMO_MODE: "true",
  NEXT_PUBLIC_STOREFRONT_URL: storefrontURL,
};

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: childEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "null"}`));
    });
  });
}

await run("npm", ["run", "build"]);
await run("node", ["--test", "e2e/smoke.test.mjs"]);
