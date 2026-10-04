import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import { connectBank } from "@/lib/tinkLink";

// Shown on day 7-14 per the spec's "Trust-First Onboarding" Phase 3 --
// never during initial onboarding. Triggered from a nudge/prompt elsewhere
// once the user has logged 10-15 manual expenses.
export default function ConnectBankScreen({ onConnected }: { onConnected?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const result = await connectBank();
      if (result.status === "success") {
        onConnected?.();
      } else if (result.status === "error") {
        Alert.alert("Couldn't connect", result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.card, cardShadow]}>
        <Text style={styles.title}>Make this automatic</Text>
        <Text style={styles.body}>
          You've been logging expenses for a week -- nice consistency. Want every transaction to appear
          instantly? Connect your bank and we'll take it from there.
        </Text>
        <Text style={styles.body}>
          Your login details never touch this app -- everything goes through Tink, which is owned by Visa.
        </Text>

        <Pressable style={styles.button} onPress={handleConnect} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Connect my bank</Text>}
        </Pressable>

        <Pressable onPress={() => onConnected?.()} disabled={loading}>
          <Text style={styles.skip}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.pageTitle, color: colors.textPrimary, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  skip: { textAlign: "center", color: colors.textDim, marginTop: spacing.lg, fontSize: 13 },
});
