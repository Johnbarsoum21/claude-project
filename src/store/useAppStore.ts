import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Expense, UserProfile } from "@/types/database";

interface AppState {
  userId: string | null;
  profile: UserProfile | null;
  expenses: Expense[];
  loading: boolean;

  init: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;

  loadProfile: () => Promise<void>;
  loadExpenses: () => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  addExpense: (input: Pick<Expense, "amount" | "category" | "description" | "date" | "is_cash">) => Promise<void>;
  addPoints: (points: number) => Promise<void>;
  answerDailyQuestion: (points: number) => Promise<void>;
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
function yesterdayStr(d = new Date()) {
  const y = new Date(d);
  y.setDate(d.getDate() - 1);
  return todayStr(y);
}

export interface OnboardingInput {
  display_name: string;
  living_situation: UserProfile["living_situation"];
  monthly_income: number;
  income_varies: boolean;
  rent: number;
  utilities: number;
  insurance: number;
  subscriptions: number;
  other_fixed_costs: number;
  savings_goal: number;
  uses_bnpl: boolean;
  bnpl_owed: number;
}

export const useAppStore = create<AppState>((set, get) => ({
  userId: null,
  profile: null,
  expenses: [],
  loading: true,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id ?? null;
    set({ userId });
    if (userId) {
      await Promise.all([get().loadProfile(), get().loadExpenses()]);
    }
    set({ loading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ userId: session?.user.id ?? null });
      if (session?.user.id) {
        await Promise.all([get().loadProfile(), get().loadExpenses()]);
      } else {
        set({ profile: null, expenses: [] });
      }
    });
  },

  signInWithEmail: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ userId: null, profile: null, expenses: [] });
  },

  loadProfile: async () => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase.from("user_profiles").select("*").eq("created_by_id", userId).maybeSingle();
    set({ profile: (data as UserProfile) ?? null });
  },

  loadExpenses: async () => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("created_by_id", userId)
      .order("date", { ascending: false })
      .limit(200);
    set({ expenses: (data as Expense[]) ?? [] });
  },

  completeOnboarding: async (input: OnboardingInput) => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
      .from("user_profiles")
      .upsert({ created_by_id: userId, ...input, onboarding_completed: true }, { onConflict: "created_by_id" })
      .select()
      .single();
    set({ profile: (data as UserProfile) ?? null });
  },

  addExpense: async (input) => {
    const userId = get().userId;
    if (!userId) return;
    const { data } = await supabase
      .from("expenses")
      .insert({ created_by_id: userId, source: "manual", ...input })
      .select()
      .single();
    if (data) {
      set({ expenses: [data as Expense, ...get().expenses] });
    }
    await get().addPoints(2);
  },

  addPoints: async (points: number) => {
    const profile = get().profile;
    const userId = get().userId;
    if (!profile || !userId) return;
    const newTotal = profile.total_points + points;
    const { data } = await supabase
      .from("user_profiles")
      .update({ total_points: newTotal })
      .eq("created_by_id", userId)
      .select()
      .single();
    if (data) set({ profile: data as UserProfile });
  },

  answerDailyQuestion: async (points: number) => {
    const profile = get().profile;
    const userId = get().userId;
    if (!profile || !userId) return;
    const today = todayStr();
    if (profile.last_question_date === today) return; // already counted today

    const newStreak = profile.last_question_date === yesterdayStr() ? profile.streak_days + 1 : 1;
    const newTotal = profile.total_points + points;

    const { data } = await supabase
      .from("user_profiles")
      .update({
        total_points: newTotal,
        streak_days: newStreak,
        daily_question_answered_today: true,
        last_question_date: today,
        last_active_date: today,
      })
      .eq("created_by_id", userId)
      .select()
      .single();
    if (data) set({ profile: data as UserProfile });
  },
}));
