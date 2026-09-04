import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Field, PrimaryButton, SectionLabel } from "../../components/ui";
import { colors, spacing } from "../../theme/tokens";
import type { ConsultantVisit, Project } from "../../types/database";

export default function VisitsSection({ project }: { project: Project }) {
  const { session } = useAuth();
  const [form, setForm] = useState({ verified_pct: "", technical_notes: "" });
  const [visits, setVisits] = useState<ConsultantVisit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("consultant_visits")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setVisits((data ?? []) as ConsultantVisit[]);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const submit = async () => {
    if (!form.technical_notes.trim() || !session?.user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("consultant_visits").insert({
      project_id: project.id,
      consultant_id: session.user.id,
      visit_date: new Date().toISOString().slice(0, 10),
      verified_pct: form.verified_pct ? Number(form.verified_pct) : null,
      technical_notes: form.technical_notes.trim(),
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setForm({ verified_pct: "", technical_notes: "" });
    load();
  };

  return (
    <Card>
      <SectionLabel>توثيق زيارة ميدانية</SectionLabel>
      <Field
        label="نسبة الإنجاز الموثّقة (%)"
        value={form.verified_pct}
        onChangeText={(v) => setForm({ ...form, verified_pct: v })}
        keyboardType="numeric"
        placeholder="44"
      />
      <Field
        label="الملاحظات الفنية"
        value={form.technical_notes}
        onChangeText={(v) => setForm({ ...form, technical_notes: v })}
        placeholder="مثال: تم التحقق من نسبة الإنجاز..."
        multiline
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title="حفظ الزيارة" onPress={submit} loading={submitting} disabled={!form.technical_notes.trim()} />

      {visits.length > 0 && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {visits.map((v) => (
            <View key={v.id} style={styles.visitItem}>
              <View style={styles.visitHeader}>
                <Text style={styles.date}>{v.visit_date}</Text>
                {v.verified_pct != null && <Text style={styles.pct}>{v.verified_pct}% موثّق</Text>}
              </View>
              <Text style={styles.notesText}>{v.technical_notes}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.sm },
  visitItem: { borderStartWidth: 3, borderStartColor: colors.green, paddingStart: spacing.md },
  visitHeader: { flexDirection: "row", justifyContent: "space-between" },
  date: { fontFamily: "monospace", fontSize: 11, color: colors.navySoft, fontWeight: "700" },
  pct: { fontFamily: "monospace", fontSize: 12, fontWeight: "700", color: colors.ink },
  notesText: { fontSize: 13.5, marginTop: 4, color: colors.ink },
});
