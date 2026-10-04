import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { DailyQuestion } from "@/types/database";

const POINTS_PER_QUESTION = 5;

export default function DailyQuestionCard() {
  const profile = useAppStore((s) => s.profile);
  const answerDailyQuestion = useAppStore((s) => s.answerDailyQuestion);
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  const alreadyAnsweredToday = profile?.last_question_date === new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("daily_questions")
        .select("*")
        .eq("world_level", profile.current_world);
      if (data && data.length > 0) {
        // Deterministic pick so every user on the same world sees a stable
        // question for the day without needing a server-side "today's pick".
        const dayIndex = Math.floor(Date.now() / 86_400_000);
        setQuestion(data[dayIndex % data.length] as DailyQuestion);
      }
      setLoading(false);
    })();
  }, [profile?.current_world]);

  if (loading) {
    return (
      <View style={[styles.card, cardShadow, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!question) return null;

  async function handleSelect(index: number) {
    if (selected !== null || alreadyAnsweredToday) return;
    setSelected(index);
    if (index === question!.correct_index) {
      await answerDailyQuestion(POINTS_PER_QUESTION);
    } else {
      await answerDailyQuestion(POINTS_PER_QUESTION); // still counts toward streak, per spec's no-punishment tone
    }
  }

  const revealed = selected !== null || alreadyAnsweredToday;

  return (
    <View style={[styles.card, cardShadow]}>
      <Text style={styles.label}>TODAY'S QUESTION</Text>
      <Text style={styles.question}>{question.question_text}</Text>

      {question.options.map((option, index) => {
        const isCorrect = index === question.correct_index;
        const isSelected = index === selected;
        return (
          <Pressable
            key={option}
            onPress={() => handleSelect(index)}
            disabled={revealed}
            style={[
              styles.option,
              revealed && isCorrect && styles.optionCorrect,
              revealed && isSelected && !isCorrect && styles.optionWrong,
            ]}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        );
      })}

      {revealed && <Text style={styles.explanation}>{question.explanation}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  centered: { alignItems: "center", justifyContent: "center", minHeight: 80 },
  label: { ...typography.label, color: colors.textDim },
  question: { ...typography.body, fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.md },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  optionCorrect: { borderColor: colors.success, backgroundColor: "#EFFBF2" },
  optionWrong: { borderColor: colors.danger, backgroundColor: "#FDEEEE" },
  optionText: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  explanation: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
});
