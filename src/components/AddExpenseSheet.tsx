import React, { useState } from "react";
import { Modal, View, Text, Pressable, TextInput, StyleSheet, FlatList } from "react-native";
import * as Icons from "lucide-react-native";
import { categories, CategoryKey, colors, radii, spacing, typography } from "@/theme/theme";
import { useAppStore } from "@/store/useAppStore";

export default function AddExpenseSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const addExpense = useAppStore((s) => s.addExpense);
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setCategory(null);
    setAmount("");
    setDescription("");
  }

  async function handleConfirm() {
    const value = Number(amount.replace(",", "."));
    if (!category || !value || value <= 0) return;
    await addExpense({
      amount: value,
      category,
      description: description.trim() || null,
      date: new Date().toISOString().slice(0, 10),
      is_cash: category === "cash",
    });
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Add expense</Text>

          {!category ? (
            <FlatList
              data={Object.entries(categories) as [CategoryKey, (typeof categories)[CategoryKey]][]}
              keyExtractor={([key]) => key}
              numColumns={3}
              columnWrapperStyle={{ gap: spacing.sm }}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item: [key, meta] }) => {
                const Icon = (Icons as any)[meta.icon] ?? Icons.Circle;
                return (
                  <Pressable style={styles.categoryCell} onPress={() => setCategory(key)}>
                    <View style={[styles.iconCircle, { backgroundColor: meta.color + "22" }]}>
                      <Icon color={meta.color} size={20} />
                    </View>
                    <Text style={styles.categoryLabel}>{meta.label}</Text>
                  </Pressable>
                );
              }}
            />
          ) : (
            <View>
              <Text style={styles.selectedCategory}>{categories[category].label}</Text>
              <TextInput
                autoFocus
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textDim}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <TextInput
                style={styles.descInput}
                placeholder="What was it for? (optional)"
                placeholderTextColor={colors.textDim}
                value={description}
                onChangeText={setDescription}
              />
              <Pressable style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmText}>Add €{amount || "0"}</Text>
              </Pressable>
              <Pressable onPress={() => setCategory(null)}>
                <Text style={styles.changeCategory}>Change category</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={() => {
              reset();
              onClose();
            }}
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,41,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.xl, maxHeight: "80%" },
  title: { ...typography.pageTitle, color: colors.textPrimary, marginBottom: spacing.lg },
  categoryCell: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  iconCircle: { width: 48, height: 48, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  categoryLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  selectedCategory: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },
  amountInput: { fontSize: 36, fontWeight: "800", color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, marginBottom: spacing.md },
  descInput: { fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
  confirmButton: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center", marginBottom: spacing.sm },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  changeCategory: { textAlign: "center", color: colors.textDim, fontSize: 13 },
  cancel: { textAlign: "center", color: colors.textDim, marginTop: spacing.lg, fontSize: 13 },
});
