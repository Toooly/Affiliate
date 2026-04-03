import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
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
  await page.getByRole("button", { name: /Accedi/i }).click();
  await page.waitForURL(
    (url) => new URL(url).pathname === targetPathname,
    { timeout: 20_000 },
  );
  await page.waitForLoadState("networkidle");
}

async function logout(page, expectedPathname) {
  await page.getByRole("button", { name: "Esci" }).first().click();
  await page.waitForURL(
    (url) => new URL(url).pathname === expectedPathname,
    { timeout: 20_000 },
  );
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

  await rm(demoDbPath, { force: true });
  await startServer();
});

after(async () => {
  if (demoDbBackup !== null) {
    await writeFile(demoDbPath, demoDbBackup, "utf8");
  } else {
    await rm(demoDbPath, { force: true });
  }

  await stopServer();
});

test(
  "admin invite -> affiliate signup -> referral -> attributed conversion -> 10% commission works end-to-end",
  { timeout: 240_000 },
  async () => {
    const browser = await chromium.launch({ headless: true });
    const suffix = Date.now().toString().slice(-6);
    const invitee = {
      fullName: `Giulia Test ${suffix}`,
      email: `giulia.test.${suffix}@creatorstudio.com`,
      password: "Creator123!",
      orderId: `SHOP-${suffix}`,
      orderAmount: "250",
    };

    try {
      const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
      await publicPage.goto(`${baseURL}/`, { waitUntil: "networkidle" });
      const homeText = await publicPage.locator("body").textContent();
      assert.ok(!/demo/i.test(homeText ?? ""));
      await publicPage.goto(`${baseURL}/login/admin`, { waitUntil: "networkidle" });
      const adminLoginText = await publicPage.locator("body").textContent();
      assert.ok(!/usa demo|demo admin|demo affiliato/i.test(adminLoginText ?? ""));
      await publicPage.goto(`${baseURL}/login/affiliate`, { waitUntil: "networkidle" });
      const affiliateLoginText = await publicPage.locator("body").textContent();
      assert.ok(!/usa demo|demo admin|demo affiliato/i.test(affiliateLoginText ?? ""));
      await publicPage.close();

      const adminPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
      await login(adminPage, "/login/admin", demoAdmin.email, demoAdmin.password, "/admin");
      await adminPage.getByText(demoAdmin.email).waitFor({ timeout: 15_000 });

      await adminPage.goto(`${baseURL}/admin/applications`, { waitUntil: "networkidle" });
      await adminPage.locator("#invite-name").fill(invitee.fullName);
      await adminPage.locator("#invite-email").fill(invitee.email);
      await adminPage.getByRole("button", { name: "Genera link invito" }).click();
      await waitForToast(adminPage, "Link invito affiliato generato.");
      const inviteUrl = await adminPage.locator("input[readonly]").last().inputValue();
      assert.match(inviteUrl, /\/register\?invite=/);
      const resolvedInviteUrl = inviteUrl.startsWith("http")
        ? inviteUrl
        : `${baseURL}${inviteUrl}`;

      await logout(adminPage, "/login/admin");
      await adminPage.close();

      const registrationPage = await browser.newPage({
        viewport: { width: 1440, height: 1800 },
      });
      await registrationPage.goto(resolvedInviteUrl, { waitUntil: "networkidle" });
      await registrationPage
        .getByRole("heading", { name: /Attiva il tuo account affiliato/i })
        .waitFor({ timeout: 15_000 });
      assert.equal(await registrationPage.locator("#register-email").inputValue(), invitee.email);
      await registrationPage.locator("#register-password").fill(invitee.password);
      await registrationPage.getByRole("button", { name: "Attiva account affiliato" }).click();
      await registrationPage.waitForURL(`${baseURL}/dashboard`, { timeout: 20_000 });
      await registrationPage.getByText("Link condivisibile principale").waitFor({
        timeout: 15_000,
      });

      const dashboardText = await registrationPage.locator("body").textContent();
      const referralSlugMatch = dashboardText?.match(/\/r\/([a-z0-9-]+)/);
      assert.ok(referralSlugMatch?.[1], "Referral slug non trovato nella dashboard affiliate.");
      const referralSlug = referralSlugMatch[1];
      assert.match(
        dashboardText ?? "",
        /https:\/\/elevianutrition\.eu/i,
        "La dashboard affiliate non mostra il link storefront verso elevianutrition.eu.",
      );

      await registrationPage.goto(`${baseURL}/dashboard/links`, { waitUntil: "networkidle" });
      await registrationPage.getByText("I tuoi link operativi").waitFor({ timeout: 15_000 });
      const linksText = await registrationPage.locator("body").textContent();
      assert.match(
        linksText ?? "",
        /Codice sconto incorporato|Nessun codice attivo collegato/i,
      );
      await registrationPage.goto(`${baseURL}/r/${referralSlug}`, { waitUntil: "networkidle" });
      const redirectedUrl = new URL(registrationPage.url());
      assert.equal(
        redirectedUrl.pathname,
        "/shop",
        `La route referral non ha portato allo shop atteso: ${registrationPage.url()}`,
      );
      assert.equal(
        redirectedUrl.searchParams.get("ref"),
        referralSlug,
        `Il parametro ref non coincide con lo slug atteso: ${registrationPage.url()}`,
      );
      await registrationPage.getByText(`Referral da ${referralSlug}`).waitFor({ timeout: 15_000 });
      const cookies = await registrationPage.context().cookies();
      assert.equal(
        cookies.find((cookie) => cookie.name === "affinity_ref")?.value,
        referralSlug,
      );
      await registrationPage.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
      await logout(registrationPage, "/login/affiliate");
      await registrationPage.close();

      const adminOpsPage = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
      await login(adminOpsPage, "/login/admin", demoAdmin.email, demoAdmin.password, "/admin");

      await adminOpsPage.goto(`${baseURL}/admin/applications`, { waitUntil: "networkidle" });
      await adminOpsPage.getByText(invitee.fullName).first().waitFor({ timeout: 15_000 });
      const applicationsText = await adminOpsPage.locator("body").textContent();
      assert.match(applicationsText ?? "", /registrato da/i);

      await adminOpsPage.goto(`${baseURL}/admin/store`, { waitUntil: "networkidle" });
      await adminOpsPage
        .getByRole("heading", {
          name: /Gestisci integrazione, catalogo, webhook e salute operativa/i,
        })
        .waitFor({
          timeout: 15_000,
        });
      await adminOpsPage.locator("#store-name").fill("Elevia Nutrition");
      await adminOpsPage.locator("#shop-domain").fill("elevianutrition.myshopify.com");
      await adminOpsPage.locator("#storefront-url").fill("/shop");
      await adminOpsPage.locator("#default-destination-url").fill("/shop");
      await adminOpsPage.getByRole("combobox").nth(0).click();
      await adminOpsPage.locator('[role="option"]').filter({ hasText: /^Installata$/ }).first().click();
      await adminOpsPage.getByRole("combobox").nth(1).click();
      await adminOpsPage.locator('[role="option"]').filter({ hasText: /^Connessa$/ }).first().click();
      await adminOpsPage.getByRole("button", { name: "Salva dettagli integrazione" }).click();
      await waitForToast(adminOpsPage, "Connessione store aggiornata.");
      await adminOpsPage.locator("#webhook-order-id").fill(invitee.orderId);
      await adminOpsPage.locator("#webhook-referral-code").fill(referralSlug);
      await adminOpsPage.locator("#webhook-order-amount").fill(invitee.orderAmount);
      await adminOpsPage.locator("#webhook-customer-email").fill(`shopper.${suffix}@mail.com`);
      await adminOpsPage.getByRole("button", { name: "Acquisisci evento store" }).click();
      await waitForToast(adminOpsPage, "Evento store acquisito e processato.");

      await adminOpsPage.goto(`${baseURL}/admin/conversions`, { waitUntil: "networkidle" });
      const conversionsText = await adminOpsPage.locator("body").textContent();
      assert.match(conversionsText ?? "", new RegExp(invitee.orderId));
      assert.match(conversionsText ?? "", new RegExp(invitee.fullName));
      assert.match(conversionsText ?? "", /25,00\s*USD/);

      await logout(adminOpsPage, "/login/admin");
      await adminOpsPage.close();

      const affiliateEarningsPage = await browser.newPage({
        viewport: { width: 1440, height: 1800 },
      });
      await login(
        affiliateEarningsPage,
        "/login/affiliate",
        invitee.email,
        invitee.password,
        "/dashboard",
      );
      await affiliateEarningsPage.goto(`${baseURL}/dashboard/earnings`, {
        waitUntil: "networkidle",
      });
      await affiliateEarningsPage.getByRole("heading", { name: /Tieni sotto controllo importi/i }).waitFor({
        timeout: 15_000,
      });
      const earningsText = await affiliateEarningsPage.locator("body").textContent();
      assert.match(earningsText ?? "", /25,00\s*USD/);
      await logout(affiliateEarningsPage, "/login/affiliate");
      await affiliateEarningsPage.close();
    } finally {
      await browser.close();
    }
  },
);
