import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { PlayCircle } from "lucide-react-native";
import { colors, radii, spacing, typography, cardShadow, CategoryKey } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";
import { recommendedVideos } from "@/data/videos";

export default function LearnScreen() {
  const expenses = useAppStore((s) => s.expenses);

  const topCategory = useMemo<CategoryKey | null>(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) totals[e.category] = (totals[e.category] ?? 0) + Number(e.amount);
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return (sorted[0]?.[0] as CategoryKey) ?? null;
  }, [expenses]);

  const videos = recommendedVideos(topCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Learn</Text>
      <Text style={styles.subtitle}>Short, jargon-free videos -- suggested based on your spending.</Text>

      {videos.map((video) => (
        <Pressable
          key={video.id}
          style={[styles.card, cardShadow]}
          onPress={() => video.youtubeId && Linking.openURL(`https://www.youtube.com/watch?v=${video.youtubeId}`)}
        >
          <View style={styles.playIcon}>
            <PlayCircle color={colors.primary} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.videoTitle}>{video.title}</Text>
            <Text style={styles.videoDesc}>{video.description}</Text>
            <Text style={styles.videoDuration}>{video.durationLabel}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  pageTitle: { ...typography.pageTitle, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg, marginTop: spacing.xs },
  card: { flexDirection: "row", gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, alignItems: "center" },
  playIcon: { width: 44, height: 44, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  videoTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  videoDesc: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  videoDuration: { fontSize: 11, color: colors.textDim, marginTop: spacing.xs },
});
