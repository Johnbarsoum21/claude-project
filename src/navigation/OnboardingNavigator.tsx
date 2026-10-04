import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch } from "react-native";
import { colors, radii, spacing, typography, cardShadow } from "@/theme/theme";
import { useAppStore, OnboardingInput } from "@/store/useAppStore";
import { calcFreeSpending } from "@/lib/freeSpending";

type LivingSituation = OnboardingInput["living_situation"];

const TYPICAL_COSTS = { rent: "€600-€900", utilities: "€80-€150", insurance: "€100-€160", subscriptions: "€30-€60" };

const STEPS = ["welcome", "name", "living", "income", "costs", "bnpl", "savings", "reveal"] as const;

export default function OnboardingNavigator() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const [displayName, setDisplayName] = useState("");
  const [livingSituation, setLivingSituation] = useState<LivingSituation>("alone");
  const [income, setIncome] = useState("");
  const [incomeVaries, setIncomeVaries] = useState(false);
  const [rent, setRent] = useState("");
  const [utilities, setUtilities] = useState("");
  const [insurance, setInsurance] = useState("");
  const [subscriptions, setSubscriptions] = useState("");
  const [otherFixed, setOtherFixed] = useState("");
  const [usesBnpl, setUsesBnpl] = useState<boolean | null>(null);
  const [bnplOwed, setBnplOwed] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");

  const num = (s: string) => (s.trim() === "" ? 0 : Math.max(0, Number(s.replace(",", ".")) || 0));

  const preview = useMemo(() => {
    const fixed = num(rent) + num(utilities) + num(insurance) + num(subscriptions) + num(otherFixed);
    const monthlyFree = Math.max(0, num(income) - fixed - num(savingsGoal) - num(bnplOwed));
    return { fixed, monthlyFree, weekly: monthlyFree / 4.3 };
  }, [rent, utilities, insurance, subscriptions, otherFixed, income, savingsGoal, bnplOwed]);

  function next() {
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function finish() {
    await completeOnboarding({
      display_name: displayName.trim() || "there",
      living_situation: livingSituation,
      monthly_income: num(income),
      income_varies: incomeVaries,
      rent: num(rent),
      utilities: num(utilities),
      insurance: num(insurance),
      subscriptions: num(subscriptions),
      other_fixed_costs: num(otherFixed),
      savings_goal: num(savingsGoal),
      uses_bnpl: usesBnpl ?? false,
      bnpl_owed: usesBnpl ? num(bnplOwed) : 0,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {step === "welcome" && (
        <Step title="The Financial Hub" subtitle="A money companion that works even when you don't open it.">
          <PrimaryButton label="Get Started" onPress={next} />
        </Step>
      )}

      {step === "name" && (
        <Step title="What should we call you?" subtitle="Just a first name is perfect.">
          <LabeledInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <PrimaryButton label="Continue" onPress={next} disabled={!displayName.trim()} />
        </Step>
      )}

      {step === "living" && (
        <Step title="What's your setup?" subtitle="This helps us frame shared costs correctly.">
          {(["alone", "roommates", "partner"] as LivingSituation[]).map((option) => (
            <OptionRow
              key={option}
              label={option === "alone" ? "I live alone" : option === "roommates" ? "I live with roommates" : "I live with my partner"}
              selected={livingSituation === option}
              onPress={() => setLivingSituation(option)}
            />
          ))}
          <PrimaryButton label="Continue" onPress={next} />
        </Step>
      )}

      {step === "income" && (
        <Step title="Monthly income (after tax)" subtitle="Not sure? Most people your age earn between €1,500-€2,500. A best guess is fine -- you can update this anytime.">
          <LabeledInput value={income} onChangeText={setIncome} placeholder="€ amount" keyboardType="decimal-pad" />
          <ToggleRow label="My income varies month to month" value={incomeVaries} onValueChange={setIncomeVaries} />
          <PrimaryButton label="Continue" onPress={next} />
        </Step>
      )}

      {step === "costs" && (
        <Step title="Fixed monthly costs" subtitle="Leave anything blank if you're not sure -- we'll use typical ranges and you can fix it later.">
          <LabeledInput value={rent} onChangeText={setRent} placeholder={`Rent (typical: ${TYPICAL_COSTS.rent})`} keyboardType="decimal-pad" />
          <LabeledInput value={utilities} onChangeText={setUtilities} placeholder={`Utilities (typical: ${TYPICAL_COSTS.utilities})`} keyboardType="decimal-pad" />
          <LabeledInput value={insurance} onChangeText={setInsurance} placeholder={`Insurance (typical: ${TYPICAL_COSTS.insurance})`} keyboardType="decimal-pad" />
          <LabeledInput value={subscriptions} onChangeText={setSubscriptions} placeholder={`Subscriptions (typical: ${TYPICAL_COSTS.subscriptions})`} keyboardType="decimal-pad" />
          <LabeledInput value={otherFixed} onChangeText={setOtherFixed} placeholder="Other fixed costs" keyboardType="decimal-pad" />
          <Text style={styles.hint}>
            First-time mover? Don't forget: health insurance, liability insurance, internet, phone plan, renter's insurance, municipal taxes.
          </Text>
          <PrimaryButton label="Continue" onPress={next} />
        </Step>
      )}

      {step === "bnpl" && (
        <Step title="Do you use Klarna, Afterpay, or other pay-later services?" subtitle="This money is already spent, even if it hasn't left your account yet.">
          <View style={styles.row}>
            <SecondaryChoice label="Yes" selected={usesBnpl === true} onPress={() => setUsesBnpl(true)} />
            <SecondaryChoice label="No" selected={usesBnpl === false} onPress={() => setUsesBnpl(false)} />
          </View>
          {usesBnpl && (
            <LabeledInput value={bnplOwed} onChangeText={setBnplOwed} placeholder="About how much do you owe right now?" keyboardType="decimal-pad" />
          )}
          <PrimaryButton label="Continue" onPress={next} disabled={usesBnpl === null} />
        </Step>
      )}

      {step === "savings" && (
        <Step title="How much do you want to save monthly?" subtitle="Not sure? Even €10/month builds the habit. €0 is fine too -- we'll focus on awareness first.">
          <LabeledInput value={savingsGoal} onChangeText={setSavingsGoal} placeholder="€ amount" keyboardType="decimal-pad" />
          <PrimaryButton label="Show me my free spending" onPress={next} />
        </Step>
      )}

      {step === "reveal" && (
        <Step title="This is your money to enjoy" subtitle="Everything else is already handled.">
          <View style={[styles.revealCard, cardShadow]}>
            <Text style={styles.revealLabel}>Free spending / month</Text>
            <Text style={styles.revealNumber}>€{preview.monthlyFree.toFixed(0)}</Text>
            <Text style={styles.revealWeekly}>that's about €{preview.weekly.toFixed(0)} / week</Text>
          </View>
          <PrimaryButton label="Let's go" onPress={finish} />
        </Step>
      )}

      {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
        <Pressable onPress={back}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={{ marginTop: spacing.lg }}>{children}</View>
    </View>
  );
}

function LabeledInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput {...props} placeholderTextColor={colors.textDim} style={styles.input} />;
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.button, disabled && { opacity: 0.5 }]} onPress={onPress} disabled={disabled}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.optionRow, selected && styles.optionRowSelected]} onPress={onPress}>
      <Text style={[styles.optionLabel, selected && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.choice, selected && styles.optionRowSelected]} onPress={onPress}>
      <Text style={[styles.optionLabel, selected && { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 1.5, flexGrow: 1, justifyContent: "center" },
  title: { ...typography.pageTitle, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
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
  hint: { ...typography.bodySmall, color: colors.textDim, marginBottom: spacing.md, lineHeight: 18 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.sm },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  back: { textAlign: "center", color: colors.textDim, marginTop: spacing.lg },
  optionRow: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.card },
  optionRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionLabel: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  choice: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, alignItems: "center", backgroundColor: colors.card },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  toggleLabel: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, marginRight: spacing.md },
  revealCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.xl, alignItems: "center", marginBottom: spacing.lg },
  revealLabel: { ...typography.label, color: colors.textDim },
  revealNumber: { fontSize: 44, fontWeight: "800", color: colors.primary, marginTop: spacing.sm },
  revealWeekly: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});
