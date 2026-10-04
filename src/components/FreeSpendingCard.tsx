import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import type { FreeSpendingSummary } from "@/lib/freeSpending";

const STATUS_COLOR: Record<FreeSpendingSummary["status"], string> = {
  healthy: colors.primary,
  tight: colors.streak,
  low: colors.danger,
};

export default function FreeSpendingCard({ summary }: { summary: FreeSpendingSummary }) {
  const barColor = STATUS_COLOR[summary.status];
  const pct = Math.min(1, Math.max(0, summary.percentRemaining));

  return (
    <View style={[styles.card, cardShadow]}>
      <Text style={styles.label}>This week's free spending</Text>
      <Text style={styles.amount}>
        €{Math.max(0, summary.remainingThisWeek).toFixed(0)} <Text style={styles.toEnjoy}>to enjoy</Text>
      </Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>€{summary.weeklyFreeSpending.toFixed(0)} / week</Text>
        <Text style={styles.footerText}>€{summary.monthlyFreeSpending.toFixed(0)} / month</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  label: { ...typography.label, color: colors.textDim },
  amount: { fontSize: 36, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.sm },
  toEnjoy: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  barTrack: { height: 10, borderRadius: radii.pill, backgroundColor: colors.primarySoft, marginTop: spacing.lg, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radii.pill },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  footerText: { ...typography.bodySmall, color: colors.textDim },
});
