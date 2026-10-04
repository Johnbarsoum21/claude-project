import React, { useState } from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/lib/supabase";

export default function SocialScreen() {
  const profile = useAppStore((s) => s.profile);
  const userId = useAppStore((s) => s.userId);
  const loadProfile = useAppStore((s) => s.loadProfile);
  const [updating, setUpdating] = useState(false);

  async function toggleSolo(value: boolean) {
    if (!userId) return;
    setUpdating(true);
    await supabase.from("user_profiles").update({ solo_mode: value }).eq("created_by_id", userId);
    await loadProfile();
    setUpdating(false);
  }

  if (!profile) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Social</Text>

      <View style={[styles.card, cardShadow]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Solo mode</Text>
            <Text style={styles.cardBody}>
              Turn this on and we'll never show social features or ask about friends. Everything else -- free
              spending, the AI, quests, levels -- still works fully.
            </Text>
          </View>
          <Switch value={profile.solo_mode} onValueChange={toggleSolo} disabled={updating} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      {!profile.solo_mode && (
        <View style={[styles.card, cardShadow, { marginTop: spacing.lg }]}>
          <Text style={styles.cardTitle}>Savings Buddy, Challenges & Leaderboard</Text>
          <Text style={styles.cardBody}>
            Coming soon: pair up with a friend for weekly accountability, join behavior-based challenges, and see
            friends ranked by level -- never by spending amount. This needs its own friends graph, so it's a
            follow-up build after the core tracking experience.
          </Text>
        </View>
      )}

      <View style={{ height: spacing.xl }} />
      <Text style={styles.privacyNote}>
        Your data is encrypted and never shared with anyone. Social features are 100% opt-in.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  pageTitle: { ...typography.pageTitle, color: colors.textPrimary, marginBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.xs },
  cardBody: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 18 },
  privacyNote: { ...typography.bodySmall, color: colors.textDim, textAlign: "center" },
});
