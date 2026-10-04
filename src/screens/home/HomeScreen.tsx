import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import * as Icons from "lucide-react-native";
import { categories, colors, radii, spacing, typography } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";
import { calcFreeSpending } from "@/lib/freeSpending";
import FreeSpendingCard from "@/components/FreeSpendingCard";
import LevelProgressCard from "@/components/LevelProgressCard";
import DailyQuestionCard from "@/components/DailyQuestionCard";
import AddExpenseSheet from "@/components/AddExpenseSheet";

export default function HomeScreen() {
  const profile = useAppStore((s) => s.profile);
  const expenses = useAppStore((s) => s.expenses);
  const loadExpenses = useAppStore((s) => s.loadExpenses);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => (profile ? calcFreeSpending(profile, expenses) : null), [profile, expenses]);

  async function onRefresh() {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }

  if (!profile || !summary) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi {profile.display_name}</Text>
          </View>
        </View>

        <FreeSpendingCard summary={summary} />

        <View style={{ height: spacing.lg }} />
        <DailyQuestionCard />

        <View style={{ height: spacing.lg }} />
        <LevelProgressCard points={profile.total_points} streakDays={profile.streak_days} />

        <View style={{ height: spacing.lg }} />
        <Pressable style={styles.addButton} onPress={() => setSheetOpen(true)}>
          <Text style={styles.addButtonText}>+ Add expense</Text>
        </Pressable>

        <View style={{ height: spacing.lg }} />
        <Text style={styles.sectionTitle}>Recent</Text>
        {expenses.slice(0, 8).map((e) => {
          const meta = categories[e.category];
          const Icon = (Icons as any)[meta.icon] ?? Icons.Circle;
          return (
            <View key={e.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: meta.color + "22" }]}>
                <Icon color={meta.color} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txLabel}>{e.description || meta.label}</Text>
                <Text style={styles.txDate}>{e.date}</Text>
              </View>
              <Text style={styles.txAmount}>-€{Number(e.amount).toFixed(2)}</Text>
            </View>
          );
        })}
        {expenses.length === 0 && <Text style={styles.emptyText}>No expenses logged yet -- tap "Add expense" to start.</Text>}
      </ScrollView>

      <AddExpenseSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  header: { marginBottom: spacing.lg },
  greeting: { ...typography.pageTitle, color: colors.textPrimary },
  addButton: { backgroundColor: colors.primarySoft, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center" },
  addButtonText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  sectionTitle: { ...typography.label, color: colors.textDim, marginBottom: spacing.sm },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm, gap: spacing.sm },
  txIcon: { width: 32, height: 32, borderRadius: radii.pill, alignItems: "center", justifyContent: "center" },
  txLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  txDate: { fontSize: 11, color: colors.textDim },
  txAmount: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  emptyText: { ...typography.bodySmall, color: colors.textDim, textAlign: "center", marginTop: spacing.lg },
});
