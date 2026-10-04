// "Ask Anything" -- the premium private chat (Core Feature 2, Mode 3).
// Calls the Claude API server-side; ANTHROPIC_API_KEY never reaches the app.
//
// POST body: { "message": string, "history"?: {role, content}[] }
// Header: Authorization: Bearer <supabase user access token>

import { requireUserId, supabaseAdmin } from "../_shared/supabaseAdmin.ts";

const SYSTEM_PROMPT = `You are the AI financial companion inside "The Financial Hub" app.
Tone: a smart, warm friend -- never a lecture, never judgmental, never preachy.
Rules:
- Answer using the user's ACTUAL data provided in context. If data is missing, say so plainly.
- Keep responses to 3-4 sentences, no jargon.
- Never recommend specific financial products unsolicited.
- Never tell the user what they "should" do -- give context and let them decide.
- Pass the "would this make someone think, or roll their eyes" test: be specific and surprising, not obvious.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const userId = await requireUserId(req);
    const { message, history } = await req.json();
    if (!message) return new Response(JSON.stringify({ error: "Missing 'message'" }), { status: 400 });

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY server env var");

    const admin = supabaseAdmin();

    const [{ data: profile }, { data: expenses }] = await Promise.all([
      admin.from("user_profiles").select("*").eq("created_by_id", userId).single(),
      admin.from("expenses").select("amount,category,date,description").eq("created_by_id", userId).order("date", { ascending: false }).limit(200),
    ]);

    const context = `User profile: ${JSON.stringify(profile)}\nRecent expenses (most recent 200): ${JSON.stringify(expenses)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        system: `${SYSTEM_PROMPT}\n\n${context}`,
        messages: [...(history ?? []), { role: "user", content: message }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't come up with an answer just now.";

    return new Response(JSON.stringify({ reply }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("ai-chat error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
