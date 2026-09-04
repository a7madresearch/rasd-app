import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Chip, Field, PrimaryButton, SecondaryButton, SectionLabel } from "../../components/ui";
import PhotoThumb from "../../components/PhotoThumb";
import { colors, spacing } from "../../theme/tokens";
import type { Note, Project } from "../../types/database";

export default function PendingReviewSection({ project }: { project: Project }) {
  const { session } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("project_id", project.id)
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });
    setNotes((data ?? []) as Note[]);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const approve = async (note: Note) => {
    if (!session?.user) return;
    setBusyId(note.id);
    const { error } = await supabase
      .from("notes")
      .update({ status: "closed", approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq("id", note.id);
    if (!error) {
      await supabase.from("status_history").insert({
        entity_type: "note",
        entity_id: note.id,
        old_status: "pending_review",
        new_status: "closed",
        changed_by: session.user.id,
      });
      load();
    }
    setBusyId(null);
  };

  const reject = async (note: Note) => {
    if (!session?.user) return;
    const reason = (reasonById[note.id] ?? "").trim();
    setBusyId(note.id);
    const { error } = await supabase
      .from("notes")
      .update({ status: "rejected", rejection_reason: reason || null })
      .eq("id", note.id);
    if (!error) {
      await supabase.from("status_history").insert({
        entity_type: "note",
        entity_id: note.id,
        old_status: "pending_review",
        new_status: "rejected",
        changed_by: session.user.id,
        comment: reason || null,
      });
      setReasonById((r) => ({ ...r, [note.id]: "" }));
      load();
    }
    setBusyId(null);
  };

  if (notes.length === 0) return null;

  return (
    <Card>
      <SectionLabel>بانتظار اعتمادي</SectionLabel>
      <View style={{ gap: spacing.lg }}>
        {notes.map((n) => (
          <View key={n.id} style={styles.item}>
            <View style={styles.row}>
              {n.photo_url ? <PhotoThumb path={n.photo_url} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.noteText}>{n.note_text}</Text>
                <Chip label={n.priority === "urgent" ? "عاجل" : "عادي"} tone={n.priority === "urgent" ? "orange" : "neutral"} />
              </View>
            </View>
            <Field
              label="سبب الرفض (فقط إذا رفضت)"
              value={reasonById[n.id] ?? ""}
              onChangeText={(v) => setReasonById((r) => ({ ...r, [n.id]: v }))}
              placeholder="اختياري"
            />
            <View style={styles.actionsRow}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="اعتماد الإغلاق" onPress={() => approve(n)} loading={busyId === n.id} />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton title="رفض وإعادة فتح" onPress={() => reject(n)} disabled={busyId === n.id} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  item: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  noteText: { fontSize: 13.5, color: colors.ink, marginBottom: 6 },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
});
