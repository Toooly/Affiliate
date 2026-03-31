import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test, { after, before } from "node:test";

import { chromium } from "playwright";

const workspaceRoot = process.cwd();
const demoDbPath = path.join(workspaceRoot, "data", "demo-db.json");
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const useExternalServer = Boolean(process.env.E2E_BASE_URL);
const demoAdmin = {
  email: "staff@elevianutrition.eu",
  password: "DemoElevia2026%",
};

let demoDbBackup = null;
let serverProcess = null;
let serverLogs = "";

async function waitForServer(timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseURL}/login`);

      if (response.ok) {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Il server non e partito in tempo utile.\n${serverLogs}`);
}

async function startServer() {
  serverProcess = spawn(
    "node",
    ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
    {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        NEXT_PUBLIC_DEMO_MODE: "true",
        NEXT_PUBLIC_APP_URL: baseURL,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  serverProcess.stdout.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  serverProcess.stderr.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });

  await waitForServer();
}

async function stopServer() {
  if (!serverProcess) {
    return;
  }

  serverProcess.kill();
  await new Promise((resolve) => setTimeout(resolve, 2_000));
}

async function login(page, pathName, email, password, targetPathname) {
  await page.goto(`${baseURL}${pathName}`, { waitUntil: "networkidle" });
  await page.getByLabel("Email o username").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Accedi/ }).click();
  await page.waitForURL(
    (url) => new URL(url).pathname === targetPathname,
    { timeout: 20_000 },
  );
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1_250);
}

async function clickActionInNamedContainer(page, itemText, actionText) {
  await page.evaluate(
    ({ itemText: expectedItemText, actionText: expectedActionText }) => {
      const normalized = (value) =>
        value?.replace(/\s+/g, " ").trim() ?? "";

      const containers = [...document.querySelectorAll("tr, article, section, div")]
        .filter((element) => {
          const text = normalized(element.textContent);
          return text.includes(expectedItemText) && text.includes(expectedActionText);
        })
        .sort(
          (left, right) =>
            normalized(left.textContent).length - normalized(right.textContent).length,
        );

      const container = containers[0];

      if (!container) {
        throw new Error(
          `Nessun contenitore trovato per "${expectedItemText}" con azione "${expectedActionText}".`,
        );
      }

      const action = [...container.querySelectorAll("a, button")].find(
        (element) => normalized(element.textContent) === expectedActionText,
      );

      if (!action) {
        throw new Error(
          `Nessuna azione "${expectedActionText}" trovata per "${expectedItemText}".`,
        );
      }

      action.click();
    },
    { itemText, actionText },
  );
}

async function extractReferralSlugFromNamedContainer(page, itemText) {
  return page.evaluate((expectedItemText) => {
    const normalized = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
    const containers = [...document.querySelectorAll("tr, article, section, div")]
      .filter((element) => {
        const text = normalized(element.textContent);
        return text.includes(expectedItemText) && text.includes("URL da condividere:");
      })
      .sort(
        (left, right) =>
          normalized(right.textContent).length - normalized(left.textContent).length,
      );
    const container = containers[0];

    if (!container) {
      throw new Error(`Nessun contenitore trovato per "${expectedItemText}".`);
    }

    const match = normalized(container.textContent).match(/\/r\/([a-z0-9-]+)/i);

    if (!match?.[1]) {
      throw new Error(`Nessun referral slug trovato per "${expectedItemText}".`);
    }

    return match[1];
  }, itemText);
}

async function waitForToast(page, message) {
  await page.getByText(message).waitFor({ timeout: 20_000 });
}

before(async () => {
  try {
    demoDbBackup = await readFile(demoDbPath, "utf8");
  } catch {
    demoDbBackup = null;
  }

  if (useExternalServer) {
    await waitForServer();
    return;
  }

  await startServer();
});

after(async () => {
  if (demoDbBackup !== null) {
    await writeFile(demoDbPath, demoDbBackup, "utf8");
  }

  await stopServer();
});

test(
  "auth, sessione, ruoli e flusso apply->approve restano operativi end-to-end",
  { timeout: 240_000 },
  async () => {
    const browser = await chromium.launch({ headless: true });

    try {
      {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
        await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
        await page.getByRole("link", { name: /Apri area Admin/i }).click();
        await page.waitForURL(`${baseURL}/login/admin`, { timeout: 15_000 });
        await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
        await page.getByRole("link", { name: /Apri area Affiliato/i }).click();
        await page.waitForURL(`${baseURL}/login/affiliate`, { timeout: 15_000 });
        await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
        await page.getByRole("link", { name: "Registrati" }).click();
        await page.waitForURL(`${baseURL}/register`, { timeout: 15_000 });

        await page.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
        assert.match(page.url(), /\/login\/affiliate(?:\/redirect\/[^/?#]+)?(?:\?.*)?$/);

        await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
        assert.match(page.url(), /\/login\/admin(?:\/redirect\/[^/?#]+)?(?:\?.*)?$/);

        await page.goto(`${baseURL}/dashboard/links`, { waitUntil: "networkidle" });
        assert.match(page.url(), /\/login\/affiliate(?:\/redirect\/[^/?#]+)?(?:\?.*)?$/);
        await page.getByLabel("Email o username").fill("luna@affinity-demo.com");
        await page.getByLabel("Password").fill("Creator123!");
        await page.getByRole("button", { name: "Accedi al portale affiliato" }).click();
        await page.waitForURL(`${baseURL}/dashboard/links`, { timeout: 20_000 });
        await page.waitForLoadState("networkidle");
        await page.getByText("Crea un nuovo referral link").waitFor({ timeout: 15_000 });
        await page.getByRole("button", { name: "Esci" }).first().click();
        await page.waitForURL(`${baseURL}/login/affiliate`, { timeout: 15_000 });

        await page.goto(`${baseURL}/login/affiliate`, { waitUntil: "networkidle" });
        await page.getByLabel("Email o username").fill("luna@affinity-demo.com");
        await page.getByLabel("Password").fill("PasswordSbagliata!");
        await page.getByRole("button", { name: "Accedi al portale affiliato" }).click();
        await page.getByText(
          "Non troviamo un account associato a queste credenziali.",
        ).waitFor({ timeout: 10_000 });
        await page.close();
      }

      {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
        await login(
          page,
          "/login/affiliate",
          "luna@affinity-demo.com",
          "Creator123!",
          "/dashboard",
        );
        await page.getByText("Codice promo principale").waitFor({ timeout: 15_000 });
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(page.url(), `${baseURL}/dashboard`);

        await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });
        assert.equal(page.url(), `${baseURL}/dashboard`);

        await page.getByRole("button", { name: "Esci" }).first().click();
        await page.waitForURL(`${baseURL}/login/affiliate`, { timeout: 15_000 });
        await page.close();
      }

      {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
        await login(
          page,
          "/login/admin",
          demoAdmin.email,
          demoAdmin.password,
          "/admin",
        );
        await page
          .getByText(demoAdmin.email)
          .waitFor({ timeout: 15_000 });
        await page.reload({ waitUntil: "networkidle" });
        assert.equal(page.url(), `${baseURL}/admin`);

        await page.getByRole("link", { name: /Gestisci Shopify|Collega Shopify/i }).first().click();
        await page.waitForURL(`${baseURL}/admin/store`, { timeout: 15_000 });
        await page.getByRole("button", { name: "Salva configurazione store" }).click();
        await waitForToast(page, "Connessione store aggiornata.");
        await page.getByRole("button", { name: "Avvia sync Shopify" }).click();
        await waitForToast(page, "Job di sincronizzazione Shopify completato.");
        await page.getByRole("link", { name: "Apri cabina di regia" }).click();
        await page.waitForURL(`${baseURL}/admin`, { timeout: 15_000 });
        await page.getByRole("link", { name: "Gestisci affiliati" }).first().click();
        await page.waitForURL(`${baseURL}/admin/affiliates`, { timeout: 15_000 });
        await page.getByText("Gestione affiliati").waitFor({ timeout: 15_000 });

        await page.goto(`${baseURL}/admin`, { waitUntil: "networkidle" });

        await page.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
        assert.equal(page.url(), `${baseURL}/admin`);

        await page.getByRole("button", { name: "Esci" }).first().click();
        await page.waitForURL(`${baseURL}/login/admin`, { timeout: 15_000 });
        await page.close();
      }

      const suffix = Date.now().toString().slice(-6);

      {
        const affiliateOpsPage = await browser.newPage({
          viewport: { width: 1440, height: 1800 },
        });
        const createdLinkName = `Launch Story ${suffix}`;
        await login(
          affiliateOpsPage,
          "/login/affiliate",
          "luna@affinity-demo.com",
          "Creator123!",
          "/dashboard",
        );

        await affiliateOpsPage.goto(`${baseURL}/dashboard/links`, { waitUntil: "networkidle" });
        await affiliateOpsPage.locator("#link-name").fill(createdLinkName);
        await affiliateOpsPage.getByRole("button", { name: "Crea link referral" }).click();
        await waitForToast(affiliateOpsPage, "Link referral creato.");
        await affiliateOpsPage.reload({ waitUntil: "networkidle" });
        await affiliateOpsPage.getByText("2 link visibili").waitFor({ timeout: 15_000 });
        const archivedLinkSlug = await extractReferralSlugFromNamedContainer(
          affiliateOpsPage,
          createdLinkName,
        );
        await clickActionInNamedContainer(affiliateOpsPage, createdLinkName, "Archivia");
        await waitForToast(affiliateOpsPage, "Link archiviato.");
        await affiliateOpsPage.reload({ waitUntil: "networkidle" });
        await affiliateOpsPage.goto(`${baseURL}/r/${archivedLinkSlug}`, {
          waitUntil: "networkidle",
        });
        await affiliateOpsPage.waitForURL(`${baseURL}/shop`, { timeout: 15_000 });
        assert.equal(
          await affiliateOpsPage.getByText(`Referral da ${archivedLinkSlug}`).count(),
          0,
        );

        await affiliateOpsPage.goto(`${baseURL}/dashboard/codes`, { waitUntil: "networkidle" });
        const createdPromoCode = `LUNA${suffix}`;
        await affiliateOpsPage.locator("#desired-code").fill(createdPromoCode);
        await affiliateOpsPage.getByRole("button", { name: "Genera codice promo" }).click();
        await waitForToast(affiliateOpsPage, "Codice promo generato.");
        await affiliateOpsPage.reload({ waitUntil: "networkidle" });
        await affiliateOpsPage.getByText(createdPromoCode).waitFor({ timeout: 15_000 });

        await affiliateOpsPage.goto(`${baseURL}/dashboard/settings`, { waitUntil: "networkidle" });
        await affiliateOpsPage
          .locator("#payoutEmail")
          .fill(`payout.${suffix}@example.com`);
        await affiliateOpsPage
          .getByRole("button", { name: "Salva impostazioni" })
          .click();
        await waitForToast(affiliateOpsPage, "Le impostazioni sono state aggiornate.");
        await affiliateOpsPage.reload({ waitUntil: "networkidle" });
        assert.equal(
          await affiliateOpsPage.locator("#payoutEmail").inputValue(),
          `payout.${suffix}@example.com`,
        );

        await affiliateOpsPage.getByRole("button", { name: "Esci" }).first().click();
        await affiliateOpsPage.waitForURL(`${baseURL}/login/affiliate`, { timeout: 15_000 });
        await affiliateOpsPage.close();
      }

      const applicant = {
        fullName: `Test Creator ${suffix}`,
        email: `test.creator.${suffix}@example.com`,
        password: "Creator123!",
        preferredCode: `TEST${suffix}`,
      };

      {
        const applyPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
        await applyPage.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
        await applyPage.locator("#register-fullName").fill(applicant.fullName);
        await applyPage.locator("input#register-email").fill(applicant.email);
        await applyPage.locator("#register-country").fill("Italia");
        await applyPage.locator("#register-password").fill(applicant.password);
        await applyPage.getByRole("button", { name: "Registrati" }).click();
        await applyPage.waitForURL(`${baseURL}/application/pending`, { timeout: 20_000 });
        await applyPage.getByText("Revisione in corso").waitFor({ timeout: 15_000 });
        await applyPage.close();
      }

      {
        const adminPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
        await login(
          adminPage,
          "/login/admin",
          demoAdmin.email,
          demoAdmin.password,
          "/admin",
        );
        await adminPage.goto(`${baseURL}/admin/applications`, { waitUntil: "networkidle" });
        await adminPage.getByText(applicant.fullName).waitFor({ timeout: 15_000 });
        await adminPage.getByRole("button", { name: "Approva affiliato" }).first().click();
        await adminPage.getByRole("dialog").waitFor({ timeout: 10_000 });
        await adminPage.getByRole("button", { name: "Approva e crea account" }).click();
        await adminPage.getByRole("dialog").waitFor({ state: "hidden", timeout: 15_000 });
        await adminPage.close();
      }

      {
        const affiliatePage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
        await login(
          affiliatePage,
          "/login/affiliate",
          applicant.email,
          applicant.password,
          "/dashboard",
        );
        await affiliatePage.getByText("Codice promo principale").waitFor({ timeout: 15_000 });
        await affiliatePage.getByText("Referral link principale").waitFor({ timeout: 15_000 });
        await affiliatePage.close();
      }

      {
        const adminPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
        await login(
          adminPage,
          "/login/admin",
          demoAdmin.email,
          demoAdmin.password,
          "/admin",
        );
        await adminPage.goto(`${baseURL}/admin/affiliates`, { waitUntil: "networkidle" });
        await clickActionInNamedContainer(adminPage, "Luna Test", "Apri");
        await adminPage.waitForURL(/\/admin\/affiliates\/.+$/, { timeout: 15_000 });
        await adminPage.getByRole("heading", { name: "Luna Test" }).waitFor({
          timeout: 15_000,
        });

        await adminPage.goto(`${baseURL}/admin/affiliates`, { waitUntil: "networkidle" });
        await clickActionInNamedContainer(adminPage, "Luna Test", "Gestisci");
        await adminPage.getByRole("dialog").waitFor({ timeout: 10_000 });
        const activeCheckbox = adminPage.getByRole("checkbox", { name: /attivo/i });
        if (await activeCheckbox.isChecked()) {
          await activeCheckbox.click();
        }
        await adminPage.getByRole("button", { name: "Salva modifiche" }).click();
        await adminPage.getByRole("dialog").waitFor({ state: "hidden", timeout: 15_000 });
        await adminPage.close();
      }

      {
        const inactiveAffiliatePage = await browser.newPage({
          viewport: { width: 1440, height: 1600 },
        });
        await login(
          inactiveAffiliatePage,
          "/login/affiliate",
          "luna@affinity-demo.com",
          "Creator123!",
          "/application/inactive",
        );
        await inactiveAffiliatePage
          .getByText("Accesso temporaneamente sospeso")
          .waitFor({ timeout: 15_000 });
        await inactiveAffiliatePage.close();
      }
    } finally {
      await browser.close();
    }
  },
);
