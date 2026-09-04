import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { pickAndUploadPhoto } from "../lib/photoUpload";
import { Card, Chip, SecondaryButton, SectionLabel } from "./ui";
import PhotoThumb from "./PhotoThumb";
import { colors, spacing } from "../theme/tokens";
import type { Note, Project } from "../types/database";

/**
 * Notes assigned to the current user for a project — closing here moves a
 * note to `pending_review`; the consultant still has to approve it for it
 * to be truly closed (see docs/rasd-scope-requirements.md §3).
 */
export default function AssignedNotesList({ project }: { project: Project }) {
  const { session } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("project_id", project.id)
      .eq("assigned_to", session.user.id)
      .in("status", ["open", "pending_review", "rejected"])
      .order("created_at", { ascending: false });
    setNotes((data ?? []) as Note[]);
  }, [project.id, session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const submitForReview = async (note: Note) => {
    if (!session?.user) return;
    setBusyId(note.id);
    try {
      let photo_url = note.photo_url;
      const uploaded = await pickAndUploadPhoto(`notes/${project.id}`);
      if (uploaded) photo_url = uploaded;

      const { error } = await supabase
        .from("notes")
        .update({
          status: "pending_review",
          closed_by: session.user.id,
          closed_at: new Date().toISOString(),
          photo_url,
        })
        .eq("id", note.id);

      if (!error) {
        await supabase.from("status_history").insert({
          entity_type: "note",
          entity_id: note.id,
          old_status: note.status,
          new_status: "pending_review",
          changed_by: session.user.id,
        });
        load();
      }
    } finally {
      setBusyId(null);
    }
  };

  if (notes.length === 0) return null;

  return (
    <Card>
      <SectionLabel>الملاحظات الموجّهة لي</SectionLabel>
      <View style={{ gap: spacing.md }}>
        {notes.map((n) => (
          <View key={n.id} style={styles.row}>
            {n.photo_url ? <PhotoThumb path={n.photo_url} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.noteText}>{n.note_text}</Text>
              <View style={styles.tagsRow}>
                <Chip label={n.priority === "urgent" ? "عاجل" : "عادي"} tone={n.priority === "urgent" ? "orange" : "neutral"} />
                <Chip label={statusLabel(n.status)} tone={statusTone(n.status)} />
              </View>
              {n.status === "rejected" && n.rejection_reason && (
                <Text style={styles.rejection}>سبب الرفض: {n.rejection_reason}</Text>
              )}
              {(n.status === "open" || n.status === "rejected") && (
                <SecondaryButton
                  title={busyId === n.id ? "جارٍ الرفع..." : "إرسال للاعتماد (مع صورة)"}
                  onPress={() => submitForReview(n)}
                  disabled={busyId === n.id}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "مفتوحة";
    case "pending_review":
      return "بانتظار الاعتماد";
    case "rejected":
      return "مرفوضة";
    default:
      return status;
  }
}

function statusTone(status: string): "orange" | "amber" | "green" | "neutral" {
  if (status === "open") return "orange";
  if (status === "pending_review") return "amber";
  if (status === "rejected") return "orange";
  return "neutral";
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  noteText: { fontSize: 13.5, color: colors.ink },
  tagsRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  rejection: { color: colors.orange, fontSize: 12, marginTop: 6 },
});
