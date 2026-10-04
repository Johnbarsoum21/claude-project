// Generates the Monday-morning weekly insight (Core Feature 2, Mode 1).
// Intended to run on a schedule (e.g. a Supabase cron trigger at Sunday
// 23:00 UTC) via `supabase functions deploy weekly-insight --no-verify-jwt`
// plus a pg_cron job that calls it for every user, or looped per-user here.
//
// POST body: { "userId": string }  -- called by the scheduler, service-role only.

import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const INSIGHT_SYSTEM_PROMPT = `You write the weekly financial insight for "The Financial Hub" app.
Standard: every insight must give context, reveal a pattern, or show progress over time -- never state the obvious
("you spent more on X"), never lecture, never use punishment framing ("you're over budget"). 2-4 sentences, warm, specific numbers.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { userId } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: "Missing 'userId'" }), { status: 400 });

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY server env var");

    const admin = supabaseAdmin();

    const { data: profile } = await admin.from("user_profiles").select("*").eq("created_by_id", userId).single();
    if (!profile) return new Response(JSON.stringify({ error: "No profile" }), { status: 404 });

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 7); // previous Sunday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data: weekExpenses } = await admin
      .from("expenses")
      .select("amount,category,date")
      .eq("created_by_id", userId)
      .gte("date", weekStart.toISOString().slice(0, 10))
      .lt("date", weekEnd.toISOString().slice(0, 10));

    const totalSpent = (weekExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory: Record<string, number> = {};
    for (const e of weekExpenses ?? []) byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const fixedCosts = profile.rent + profile.utilities + profile.insurance + profile.subscriptions + profile.other_fixed_costs;
    const monthlyFree = Math.max(0, profile.monthly_income - fixedCosts - profile.savings_goal - profile.bnpl_owed);
    const weeklyBudget = monthlyFree / 4.3;

    const { data: priorInsights } = await admin
      .from("weekly_insights")
      .select("week_start,total_spent,budget")
      .eq("created_by_id", userId)
      .order("week_start", { ascending: false })
      .limit(4);

    const prompt = `This week: spent €${totalSpent.toFixed(2)} of a €${weeklyBudget.toFixed(2)} weekly free-spending budget.
Spending by category: ${JSON.stringify(byCategory)}. Top category: ${topCategory}.
Previous weeks (most recent first): ${JSON.stringify(priorInsights)}.
Write this user's weekly insight now.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 200,
        system: INSIGHT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error (${res.status}): ${await res.text()}`);
    const data = await res.json();
    const insightText = data.content?.[0]?.text ?? "";

    const { error } = await admin.from("weekly_insights").upsert(
      {
        created_by_id: userId,
        insight_text: insightText,
        week_start: weekStart.toISOString().slice(0, 10),
        total_spent: totalSpent,
        budget: weeklyBudget,
        top_category: topCategory,
      },
      { onConflict: "created_by_id,week_start" }
    );
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, insightText }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("weekly-insight error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
