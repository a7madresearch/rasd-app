import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { summarizePendingTasks } from "../lib/aiAssistant";
import { Card, PrimaryButton } from "./ui";
import { colors, radius, spacing } from "../theme/tokens";
import type { Project } from "../types/database";

export default function AiSummaryCard({ project }: { project: Project }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await summarizePendingTasks(project.id);
      setSummary(text);
    } catch (e: any) {
      setError(e?.message ?? "تعذّر الاتصال بالمساعد الذكي.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Sparkles size={14} color={colors.white} />
        </View>
        <Text style={styles.title}>مساعد رصد الذكي</Text>
      </View>

      {!summary && !loading && (
        <PrimaryButton title="لخّص المهام المعلقة" onPress={run} />
      )}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.navy} />
          <Text style={styles.loadingText}>يحلّل بيانات المشروع...</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {summary && !loading && (
        <>
          <Text style={styles.summary}>{summary}</Text>
          <PrimaryButton title="تحديث الملخص" onPress={run} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    borderStyle: "dashed",
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14.5, fontWeight: "700", color: colors.ink },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  loadingText: { color: colors.inkSoft, fontSize: 12.5 },
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.sm },
  summary: { fontSize: 13.5, lineHeight: 21, color: colors.ink, marginTop: spacing.sm },
});
