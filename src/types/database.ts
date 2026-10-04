export type LivingSituation = "alone" | "roommates" | "partner";
export type WorldKey = "starter" | "balanced" | "independent";
export type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "going_out"
  | "coffee"
  | "health"
  | "subscriptions"
  | "bnpl"
  | "cash"
  | "other";

export interface UserProfile {
  id: string;
  created_by_id: string;
  display_name: string;
  living_situation: LivingSituation;
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
  onboarding_completed: boolean;
  total_points: number;
  streak_days: number;
  last_active_date: string | null;
  solo_mode: boolean;
  daily_question_answered_today: boolean;
  last_question_date: string | null;
  current_world: WorldKey;
  tink_connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  created_by_id: string;
  amount: number;
  category: CategoryKey;
  description: string | null;
  date: string;
  is_cash: boolean;
  source: "manual" | "tink";
  tink_transaction_id: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  created_by_id: string;
  name: string;
  amount: number;
  renewal_day: number;
  is_active: boolean;
  category: "entertainment" | "utilities" | "health" | "productivity" | "finance" | "other";
  notes: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  created_by_id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface Quest {
  id: string;
  created_by_id: string;
  title: string;
  description: string | null;
  points: number;
  quest_type: "daily" | "monthly";
  target_value: number;
  current_value: number;
  is_completed: boolean;
  date: string;
}

export interface DailyQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  world_level: WorldKey;
  related_video_title: string | null;
}

export interface WeeklyInsight {
  id: string;
  created_by_id: string;
  insight_text: string;
  week_start: string;
  total_spent: number;
  budget: number;
  top_category: CategoryKey | null;
  is_read: boolean;
  created_at: string;
}

export interface BnplCommitment {
  id: string;
  created_by_id: string;
  description: string;
  amount: number;
  due_date: string | null;
  is_settled: boolean;
  created_at: string;
}

export interface TinkConnection {
  id: string;
  created_by_id: string;
  provider_name: string | null;
  external_account_id: string;
  connected_at: string;
  last_synced_at: string | null;
}

// Minimal Supabase Database generic shape -- extend with `supabase gen types`
// against the real project once it's provisioned.
export interface Database {
  public: {
    Tables: {
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      subscriptions: { Row: Subscription; Insert: Partial<Subscription>; Update: Partial<Subscription> };
      savings_goals: { Row: SavingsGoal; Insert: Partial<SavingsGoal>; Update: Partial<SavingsGoal> };
      quests: { Row: Quest; Insert: Partial<Quest>; Update: Partial<Quest> };
      daily_questions: { Row: DailyQuestion; Insert: Partial<DailyQuestion>; Update: Partial<DailyQuestion> };
      weekly_insights: { Row: WeeklyInsight; Insert: Partial<WeeklyInsight>; Update: Partial<WeeklyInsight> };
      bnpl_commitments: { Row: BnplCommitment; Insert: Partial<BnplCommitment>; Update: Partial<BnplCommitment> };
      tink_connections: { Row: TinkConnection; Insert: Partial<TinkConnection>; Update: Partial<TinkConnection> };
    };
  };
}
