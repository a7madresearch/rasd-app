import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { Card, Chip, SectionLabel } from "../../components/ui";
import { colors, spacing } from "../../theme/tokens";
import type { Note, Project } from "../../types/database";

export default function AllNotesSection({ project }: { project: Project }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotes((data ?? []) as Note[]);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const assigneeLabel = (n: Note) => {
    if (n.assigned_to === project.contractor_id) return "المقاول";
    if (n.assigned_to === project.owner_id) return "المالك";
    return "";
  };

  const openCount = notes.filter((n) => n.status === "open" || n.status === "pending_review").length;

  return (
    <Card>
      <View style={styles.header}>
        <SectionLabel>كل الملاحظات</SectionLabel>
        <Text style={[styles.count, { color: openCount > 0 ? colors.orange : colors.green }]}>
          {openCount} قيد المتابعة
        </Text>
      </View>
      <View style={{ gap: spacing.sm }}>
        {notes.map((n) => (
          <View key={n.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: dotColor(n.status) }]} />
            <Text style={styles.text} numberOfLines={2}>
              {n.note_text}
            </Text>
            <Chip label={assigneeLabel(n)} />
            <Chip label={statusLabel(n.status)} tone={statusTone(n.status)} />
          </View>
        ))}
        {notes.length === 0 && <Text style={styles.empty}>لا توجد ملاحظات بعد.</Text>}
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
    case "closed":
      return "مغلقة";
    case "rejected":
      return "مرفوضة";
    default:
      return status;
  }
}
function statusTone(status: string): "orange" | "amber" | "green" | "neutral" {
  if (status === "open") return "orange";
  if (status === "pending_review") return "amber";
  if (status === "closed") return "green";
  return "neutral";
}
function dotColor(status: string) {
  if (status === "closed") return colors.green;
  if (status === "pending_review") return "#E8C767";
  return colors.orange;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  count: { fontFamily: "monospace", fontSize: 11, fontWeight: "700", marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line, borderStyle: "dashed" as any, flexWrap: "wrap" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { flex: 1, fontSize: 13, color: colors.ink, minWidth: 120 },
  empty: { color: colors.inkSoft, fontSize: 12.5 },
});
