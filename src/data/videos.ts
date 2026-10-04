import type { CategoryKey } from "@/theme/theme";

export interface Video {
  id: string;
  title: string;
  durationLabel: string;
  description: string;
  youtubeId?: string; // fill in with real IDs when the library is produced
  triggerCategory?: CategoryKey; // used for context-aware recommendation
}

export const VIDEOS: Video[] = [
  { id: "first-budget", title: "Your First Budget After Moving Out", durationLabel: "2:15", description: "The basics of splitting income into fixed costs, savings, and free spending." },
  { id: "fixed-costs", title: "Fixed Costs You Didn't Know About", durationLabel: "1:48", description: "Liability insurance, municipal taxes, and other first-mover surprises." },
  { id: "grocery", title: "Grocery Shopping Without Overspending", durationLabel: "3:02", description: "Simple habits that cut grocery bills without meal-prepping your life away.", triggerCategory: "food" },
  { id: "klarna", title: "Why Klarna Gets Expensive Fast", durationLabel: "2:31", description: "How BNPL commitments quietly stack up.", triggerCategory: "bnpl" },
  { id: "cooking-vs-takeout", title: "Cooking vs. Takeout -- The Math", durationLabel: "1:55", description: "The real yearly cost difference, with numbers.", triggerCategory: "going_out" },
  { id: "split-rent", title: "How To Split Rent Fairly", durationLabel: "2:10", description: "Fair ways to divide shared costs with roommates or a partner." },
  { id: "emergency-fund", title: "Your First Emergency Fund", durationLabel: "2:44", description: "Why 3-6 months of expenses is the usual target, and how to get there." },
  { id: "subscriptions", title: "Subscriptions You Forgot About", durationLabel: "1:33", description: "A 5-minute audit that usually finds real money.", triggerCategory: "subscriptions" },
];

export function recommendedVideos(topCategory: CategoryKey | null): Video[] {
  if (!topCategory) return VIDEOS;
  const matching = VIDEOS.filter((v) => v.triggerCategory === topCategory);
  const rest = VIDEOS.filter((v) => v.triggerCategory !== topCategory);
  return [...matching, ...rest];
}
