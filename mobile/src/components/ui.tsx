import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from "react-native";
import { colors, radius, spacing } from "../theme/tokens";

export function Card({ children, style }: ViewProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={styles.sectionLabel}>{children}</Text>
    </View>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.inkSoft}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.primaryBtnText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "orange" | "green" | "amber";
}) {
  const bg =
    tone === "orange"
      ? colors.orange
      : tone === "green"
      ? colors.green
      : tone === "amber"
      ? "#E8C767"
      : colors.paperDeep;
  const fg = tone === "amber" ? colors.ink : tone === "neutral" ? colors.ink : colors.white;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sectionLabelWrap: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: "dashed" as any,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.navySoft,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navySoft,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    marginTop: spacing.sm,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  secondaryBtnText: {
    color: colors.navySoft,
    fontWeight: "600",
    fontSize: 13.5,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
