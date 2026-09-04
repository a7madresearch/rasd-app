import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card, Chip, Field, PrimaryButton, SectionLabel } from "./ui";
import { colors, radius, spacing } from "../theme/tokens";
import type { Consultation, PriorityLevel, Project } from "../types/database";

const PRIORITIES: { value: PriorityLevel; label: string }[] = [
  { value: "normal", label: "عادي" },
  { value: "urgent", label: "عاجل" },
];

export default function RaiseConsultationSection({ project }: { project: Project }) {
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<Consultation[]>([]);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("project_id", project.id)
      .eq("raised_by", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setMine((data ?? []) as Consultation[]);
  }, [project.id, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const submit = async () => {
    if (!text.trim() || !session?.user) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("consultations").insert({
      project_id: project.id,
      raised_by: session.user.id,
      priority,
      status: "submitted",
      question_text: text.trim(),
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
    setPriority("normal");
    load();
  };

  return (
    <Card>
      <SectionLabel>رفع استشارة (RFI)</SectionLabel>
      <Field label="السؤال / طلب التوضيح" value={text} onChangeText={setText} placeholder="اكتب سؤالك للاستشاري..." multiline />
      <View style={styles.chipRow}>
        {PRIORITIES.map((p) => (
          <Pressable key={p.value} onPress={() => setPriority(p.value)} style={[styles.chip, priority === p.value && styles.chipActive]}>
            <Text style={[styles.chipText, priority === p.value && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title="إرسال الاستشارة" onPress={submit} loading={submitting} disabled={!text.trim()} />

      {mine.length > 0 && (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          {mine.map((c) => (
            <View key={c.id} style={styles.item}>
              <Text style={styles.question}>{c.question_text}</Text>
              <View style={styles.tagsRow}>
                <Chip label={statusLabel(c.status)} tone={statusTone(c.status)} />
              </View>
              {c.answer_text && <Text style={styles.answer}>الرد: {c.answer_text}</Text>}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "مُرسلة";
    case "answered":
      return "مُجابة";
    case "converted":
      return "تحوّلت لملاحظة";
    default:
      return status;
  }
}
function statusTone(status: string): "orange" | "amber" | "green" | "neutral" {
  if (status === "submitted") return "amber";
  if (status === "answered") return "green";
  return "neutral";
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  chip: {
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12.5, fontWeight: "600", color: colors.ink },
  chipTextActive: { color: colors.white },
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.sm },
  item: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.sm },
  question: { fontSize: 13.5, color: colors.ink, marginBottom: 4 },
  tagsRow: { flexDirection: "row" },
  answer: { fontSize: 12.5, color: colors.navySoft, marginTop: 4 },
});
