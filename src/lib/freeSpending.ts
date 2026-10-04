import type { Expense, UserProfile } from "@/types/database";

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function weeksRemainingInMonth(today: Date = new Date()): number {
  const total = daysInMonth(today.getFullYear(), today.getMonth());
  const daysLeft = total - today.getDate() + 1;
  return Math.max(1, Math.round(daysLeft / 7));
}

export interface FreeSpendingSummary {
  monthlyFreeSpending: number;
  weeklyFreeSpending: number;
  spentThisWeek: number;
  remainingThisWeek: number;
  percentRemaining: number; // 0..1
  status: "healthy" | "tight" | "low";
}

export function calcFreeSpending(profile: UserProfile, expenses: Expense[], today: Date = new Date()): FreeSpendingSummary {
  const fixedCosts = profile.rent + profile.utilities + profile.insurance + profile.subscriptions + profile.other_fixed_costs;
  const monthlyFreeSpending = Math.max(0, profile.monthly_income - fixedCosts - profile.savings_goal - profile.bnpl_owed);
  const weeks = weeksRemainingInMonth(today);
  const weeklyFreeSpending = monthlyFreeSpending / weeks;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const spentThisWeek = expenses
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const remainingThisWeek = weeklyFreeSpending - spentThisWeek;
  const percentRemaining = weeklyFreeSpending > 0 ? Math.max(0, remainingThisWeek / weeklyFreeSpending) : 0;

  const status: FreeSpendingSummary["status"] = percentRemaining < 0.2 ? "low" : percentRemaining < 0.5 ? "tight" : "healthy";

  return { monthlyFreeSpending, weeklyFreeSpending, spentThisWeek, remainingThisWeek, percentRemaining, status };
}
