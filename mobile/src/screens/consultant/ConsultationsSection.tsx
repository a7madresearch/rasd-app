import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Chip, Field, PrimaryButton, SecondaryButton, SectionLabel } from "../../components/ui";
import { colors, radius, spacing } from "../../theme/tokens";
import type { Consultation, Project } from "../../types/database";

export default function ConsultationsSection({ project }: { project: Project }) {
  const { session } = useAuth();
  const [items, setItems] = useState<Consultation[]>([]);
  const [answerById, setAnswerById] = useState<Record<string, string>>({});
  const [assigneeById, setAssigneeById] = useState<Record<string, "contractor" | "owner">>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("consultations")
      .select("*")
      .eq("project_id", project.id)
      .eq("status", "submitted")
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Consultation[]);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const answer = async (c: Consultation) => {
    if (!session?.user) return;
    const text = (answerById[c.id] ?? "").trim();
    if (!text) return;
    setBusyId(c.id);
    const { error } = await supabase
      .from("consultations")
      .update({ status: "answered", answer_text: text, answered_by: session.user.id })
      .eq("id", c.id);
    if (!error) load();
    setBusyId(null);
  };

  const convertToNote = async (c: Consultation) => {
    if (!session?.user) return;
    const assignee = assigneeById[c.id] ?? "contractor";
    setBusyId(c.id);
    const assigned_to = assignee === "contractor" ? project.contractor_id : project.owner_id;
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .insert({
        project_id: project.id,
        source_consultation_id: c.id,
        created_by: session.user.id,
        assigned_to,
        priority: c.priority,
        status: "open",
        note_text: c.question_text,
      })
      .select()
      .single();

    if (!noteError && note) {
      await supabase
        .from("consultations")
        .update({ status: "converted", converted_note_id: note.id })
        .eq("id", c.id);
      load();
    }
    setBusyId(null);
  };

  if (items.length === 0) return null;

  return (
    <Card>
      <SectionLabel>الاستشارات الواردة (RFI)</SectionLabel>
      <View style={{ gap: spacing.lg }}>
        {items.map((c) => (
          <View key={c.id} style={styles.item}>
            <Text style={styles.question}>{c.question_text}</Text>
            <Chip label={c.priority === "urgent" ? "عاجل" : "عادي"} tone={c.priority === "urgent" ? "orange" : "neutral"} />

            <Field
              label="الرد التوضيحي"
              value={answerById[c.id] ?? ""}
              onChangeText={(v) => setAnswerById((a) => ({ ...a, [c.id]: v }))}
              placeholder="اكتب رداً إن كان الأمر يحتاج توضيحاً فقط"
              multiline
            />
            <PrimaryButton title="إرسال الرد وإغلاق" onPress={() => answer(c)} loading={busyId === c.id} disabled={!(answerById[c.id] ?? "").trim()} />

            <Text style={styles.orLabel}>— أو حوّلها لملاحظة تنفيذ —</Text>
            <View style={styles.chipRow}>
              {(["contractor", "owner"] as const).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setAssigneeById((a) => ({ ...a, [c.id]: v }))}
                  style={[styles.chip, (assigneeById[c.id] ?? "contractor") === v && styles.chipActive]}
                >
                  <Text style={[styles.chipText, (assigneeById[c.id] ?? "contractor") === v && styles.chipTextActive]}>
                    {v === "contractor" ? "توجيه للمقاول" : "توجيه للمالك"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <SecondaryButton title="تحويل إلى ملاحظة" onPress={() => convertToNote(c)} disabled={busyId === c.id} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md, gap: 4 },
  question: { fontSize: 13.5, color: colors.ink, marginBottom: 4 },
  orLabel: { fontSize: 11.5, color: colors.inkSoft, textAlign: "center", marginTop: spacing.md, marginBottom: 6 },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  chip: {
    flex: 1,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.ink },
  chipTextActive: { color: colors.white },
});
