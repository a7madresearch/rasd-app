import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Field, PrimaryButton, SectionLabel } from "../../components/ui";
import { colors, spacing } from "../../theme/tokens";
import type { ContractorUpdate, Project } from "../../types/database";
import AssignedNotesList from "../../components/AssignedNotesList";
import RaiseConsultationSection from "../../components/RaiseConsultationSection";

export default function ContractorScreen({ project }: { project: Project }) {
  const { session } = useAuth();
  const [form, setForm] = useState({ phase: "", completion_pct: "", obstacles: "", requirements: "" });
  const [updates, setUpdates] = useState<ContractorUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("contractor_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setUpdates((data ?? []) as ContractorUpdate[]);
    setLoading(false);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const submit = async () => {
    if (!form.phase.trim() || !session?.user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("contractor_updates").insert({
      project_id: project.id,
      contractor_id: session.user.id,
      phase: form.phase.trim(),
      completion_pct: form.completion_pct ? Number(form.completion_pct) : null,
      obstacles: form.obstacles.trim() || null,
      requirements: form.requirements.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ phase: "", completion_pct: "", obstacles: "", requirements: "" });
    load();
  };

  return (
    <FlatList
      data={updates}
      keyExtractor={(u) => u.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg }}>
          <Card>
            <SectionLabel>تحديث حالة المشروع</SectionLabel>
            <Field label="المرحلة الحالية" value={form.phase} onChangeText={(v) => setForm({ ...form, phase: v })} placeholder="مثال: صب سقف الطابق السابع" />
            <Field
              label="نسبة الإنجاز (%)"
              value={form.completion_pct}
              onChangeText={(v) => setForm({ ...form, completion_pct: v })}
              keyboardType="numeric"
              placeholder="45"
            />
            <Field label="العقبات / التأخيرات" value={form.obstacles} onChangeText={(v) => setForm({ ...form, obstacles: v })} placeholder="اختياري" multiline />
            <Field label="متطلبات" value={form.requirements} onChangeText={(v) => setForm({ ...form, requirements: v })} placeholder="اختياري" multiline />
            {error && <Text style={styles.error}>{error}</Text>}
            <PrimaryButton title="نشر التحديث" onPress={submit} loading={submitting} disabled={!form.phase.trim()} />
          </Card>

          <AssignedNotesList project={project} />

          <RaiseConsultationSection project={project} />

          <SectionLabel>سجل التحديثات</SectionLabel>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={styles.date}>{item.created_at?.slice(0, 10)}</Text>
          <Text style={styles.line}>
            <Text style={styles.bold}>المرحلة: </Text>
            {item.phase}
          </Text>
          {item.completion_pct != null && (
            <Text style={styles.line}>
              <Text style={styles.bold}>نسبة الإنجاز: </Text>
              {item.completion_pct}%
            </Text>
          )}
          {item.obstacles && (
            <Text style={[styles.line, { color: colors.orange }]}>
              <Text style={styles.bold}>عقبات: </Text>
              {item.obstacles}
            </Text>
          )}
          {item.requirements && (
            <Text style={styles.line}>
              <Text style={styles.bold}>متطلبات: </Text>
              {item.requirements}
            </Text>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  date: { fontFamily: "monospace", fontSize: 11, color: colors.navySoft, fontWeight: "700", marginBottom: 4 },
  line: { fontSize: 13.5, marginTop: 2, color: colors.ink },
  bold: { fontWeight: "700" },
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.sm },
});
