import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";

export default function AuthScreen() {
  const signInWithEmail = useAppStore((s) => s.signInWithEmail);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>The Financial Hub</Text>
      <Text style={styles.tagline}>See what you can freely enjoy.</Text>

      {sent ? (
        <Text style={styles.body}>Check {email} for a magic link to sign in.</Text>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={handleSend} disabled={loading || !email}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Get Started</Text>}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: "center" },
  logo: { ...typography.pageTitle, fontSize: 26, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.sm },
  tagline: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xxl },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center" },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  body: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm, textAlign: "center" },
});
