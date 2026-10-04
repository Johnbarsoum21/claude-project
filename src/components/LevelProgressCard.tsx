import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import { progressToNextLevel, worldMeta } from "@/data/levels";

export default function LevelProgressCard({ points, streakDays }: { points: number; streakDays: number }) {
  const { level, world, pointsIntoLevel, pointsForNext, progress, isMax } = progressToNextLevel(points);
  const meta = worldMeta(world);

  return (
    <View style={[styles.card, cardShadow]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.worldLabel}>{meta.label.toUpperCase()}</Text>
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streakDays}d</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: meta.color }]} />
      </View>

      <Text style={styles.footerText}>
        {isMax ? "Financially Free -- max level reached" : `${pointsIntoLevel} / ${pointsForNext} pts to Level ${level + 1}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  worldLabel: { ...typography.label, color: colors.textDim },
  levelText: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, marginTop: spacing.xs },
  streakPill: { backgroundColor: "#FFF7E6", borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  streakText: { fontSize: 13, fontWeight: "700", color: colors.streak },
  barTrack: { height: 8, borderRadius: radii.pill, backgroundColor: colors.primarySoft, marginTop: spacing.lg, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: radii.pill },
  footerText: { ...typography.bodySmall, color: colors.textDim, marginTop: spacing.sm },
});
