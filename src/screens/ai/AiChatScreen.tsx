import React, { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { colors, radii, spacing, typography } from "@/theme/theme";
import { env } from "@/config/env";
import { supabase } from "@/lib/supabase";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's my most expensive habit?",
  "How much did I spend going out last month?",
  "Am I spending more than last month?",
];

export default function AiChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken || !env.apiBaseUrl) throw new Error("Not configured");

      const res = await fetch(`${env.apiBaseUrl}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: userMessage.content, history: messages }),
      });
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply ?? "Something went wrong." }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "I couldn't reach the server just now -- try again in a bit." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Ask anything</Text>
          <Text style={styles.emptyBody}>Private, judgment-free questions about your own money.</Text>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.pill} onPress={() => send(s)}>
              <Text style={styles.pillText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={item.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant}>{item.content}</Text>
            </View>
          )}
        />
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.sm }} />}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your money..."
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
        />
        <Pressable style={styles.sendButton} onPress={() => send(input)}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  emptyState: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  emptyTitle: { ...typography.pageTitle, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.sm },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
  pill: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, padding: spacing.md, marginBottom: spacing.sm, alignItems: "center" },
  pillText: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  bubble: { maxWidth: "85%", borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  bubbleUser: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  bubbleAssistant: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" },
  bubbleTextUser: { color: colors.white, fontSize: 14 },
  bubbleTextAssistant: { color: colors.textPrimary, fontSize: 14 },
  inputRow: { flexDirection: "row", padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 14, color: colors.textPrimary },
  sendButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingHorizontal: spacing.lg, justifyContent: "center" },
  sendText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
