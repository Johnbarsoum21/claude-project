// Design tokens from The Financial Hub spec (V4.0)

export const colors = {
  background: "#F6F7FB",
  card: "#FFFFFF",
  border: "#E9ECF2",

  primary: "#2563EB",
  primarySoft: "#EFF4FF",
  accent: "#0EA5E9",

  success: "#16A34A", // Starter world
  streak: "#F59E0B",
  danger: "#EF4444",
  gold: "#D97706",
  purple: "#7C3AED", // Independent world
  blue: "#2563EB", // Balanced world

  textPrimary: "#0F172A",
  textSecondary: "#5B6578",
  textDim: "#94A3B8",

  white: "#FFFFFF",
} as const;

export const cardShadow = {
  shadowColor: "rgba(15,23,41,1)",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 14,
  elevation: 3,
} as const;

export const typography = {
  fontFamily: "DMSans_500Medium",
  fontFamilyBold: "DMSans_700Bold",
  fontFamilyExtraBold: "DMSans_800ExtraBold",

  pageTitle: { fontSize: 22, fontWeight: "800" as const },
  largeNumber: { fontSize: 32, fontWeight: "800" as const },
  body: { fontSize: 14, fontWeight: "500" as const },
  bodySmall: { fontSize: 13, fontWeight: "500" as const },
  label: {
    fontSize: 11,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1.1,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// World identity (3 worlds, 30 levels total)
export const worlds = {
  starter: { label: "Starter", color: colors.success, levels: [1, 10] as const },
  balanced: { label: "Balanced", color: colors.blue, levels: [11, 20] as const },
  independent: { label: "Independent", color: colors.purple, levels: [21, 30] as const },
} as const;

export type WorldKey = keyof typeof worlds;

// Spending categories with functional icon name (lucide-react-native) + color
export const categories = {
  food: { label: "Food & Drinks", icon: "Utensils", color: "#F59E0B" },
  transport: { label: "Transport", icon: "Bus", color: "#3B82F6" },
  shopping: { label: "Shopping", icon: "ShoppingBag", color: "#EC4899" },
  going_out: { label: "Going Out", icon: "Film", color: "#8B5CF6" },
  coffee: { label: "Coffee", icon: "Coffee", color: "#92400E" },
  health: { label: "Health", icon: "Heart", color: "#EF4444" },
  subscriptions: { label: "Subscriptions", icon: "Wifi", color: "#6366F1" },
  bnpl: { label: "Klarna / Pay Later", icon: "CreditCard", color: "#F97316" },
  cash: { label: "Cash", icon: "Banknote", color: "#64748B" },
  other: { label: "Other", icon: "Circle", color: "#94A3B8" },
} as const;

export type CategoryKey = keyof typeof categories;
