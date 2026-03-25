import type {
  ActivityItem,
  ChartPoint,
  Conversion,
  DashboardStats,
  LinkClick,
  Payout,
  ReferralLink,
} from "@/lib/types";

function sameDay(dateA: Date, dateB: Date) {
  return dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10);
}

export function calculateDashboardStats(
  clicks: LinkClick[],
  conversions: Conversion[],
) {
  const activeConversions = conversions.filter(
    (conversion) => conversion.status !== "cancelled",
  );
  const paidConversions = activeConversions.filter(
    (conversion) => conversion.status === "paid",
  );
  const unpaidConversions = activeConversions.filter(
    (conversion) => conversion.status !== "paid",
  );

  const totalRevenue = activeConversions.reduce(
    (sum, conversion) => sum + conversion.orderAmount,
    0,
  );
  const totalCommission = activeConversions.reduce(
    (sum, conversion) => sum + conversion.commissionAmount,
    0,
  );
  const paidCommission = paidConversions.reduce(
    (sum, conversion) => sum + conversion.commissionAmount,
    0,
  );
  const pendingCommission = unpaidConversions.reduce(
    (sum, conversion) => sum + conversion.commissionAmount,
    0,
  );

  return {
    clicks: clicks.length,
    conversions: activeConversions.length,
    conversionRate:
      clicks.length === 0 ? 0 : (activeConversions.length / clicks.length) * 100,
    totalRevenue,
    totalCommission,
    pendingCommission,
    paidCommission,
  } satisfies DashboardStats;
}

export function buildPerformanceSeries(
  clicks: LinkClick[],
  conversions: Conversion[],
  days = 30,
) {
  const today = new Date();
  const points: ChartPoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - index);

    const dayClicks = clicks.filter((click) =>
      sameDay(new Date(click.createdAt), current),
    );
    const dayConversions = conversions.filter(
      (conversion) =>
        conversion.status !== "cancelled" &&
        sameDay(new Date(conversion.createdAt), current),
    );

    points.push({
      date: current.toISOString().slice(0, 10),
      clicks: dayClicks.length,
      conversions: dayConversions.length,
      revenue: dayConversions.reduce(
        (sum, conversion) => sum + conversion.orderAmount,
        0,
      ),
      commission: dayConversions.reduce(
        (sum, conversion) => sum + conversion.commissionAmount,
        0,
      ),
    });
  }

  return points;
}

export function buildRecentActivity(
  clicks: LinkClick[],
  conversions: Conversion[],
  payouts: Payout[],
  referralLinks: ReferralLink[],
) {
  const clickItems: ActivityItem[] = clicks.slice(-4).map((click) => ({
    id: click.id,
    type: "click",
    title: "Nuovo click referral",
    detail:
      referralLinks.find((link) => link.id === click.referralLinkId)?.code ??
      "Visita tracciata",
    occurredAt: click.createdAt,
  }));

  const conversionItems: ActivityItem[] = conversions.slice(-4).map(
    (conversion) => ({
      id: conversion.id,
      type: "conversion",
      title: `Ordine ${conversion.orderId}`,
      detail: `Conversione ${conversion.status}`,
      occurredAt: conversion.createdAt,
      amount: conversion.orderAmount,
    }),
  );

  const payoutItems: ActivityItem[] = payouts.slice(-3).map((payout) => ({
    id: payout.id,
    type: "payout",
    title: `Payout ${payout.status}`,
    detail: payout.reference ?? "Riferimento payout in attesa",
    occurredAt: payout.paidAt ?? payout.createdAt,
    amount: payout.amount,
  }));

  return [...clickItems, ...conversionItems, ...payoutItems]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() -
        new Date(left.occurredAt).getTime(),
    )
    .slice(0, 8);
}
