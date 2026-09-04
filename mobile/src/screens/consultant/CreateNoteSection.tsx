import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { pickAndUploadPhoto } from "../../lib/photoUpload";
import { Card, Field, PrimaryButton, SectionLabel } from "../../components/ui";
import { colors, radius, spacing } from "../../theme/tokens";
import type { PriorityLevel, Project } from "../../types/database";

const ASSIGNEES: { value: "contractor" | "owner"; label: string }[] = [
  { value: "contractor", label: "المقاول" },
  { value: "owner", label: "المالك" },
];
const PRIORITIES: { value: PriorityLevel; label: string }[] = [
  { value: "normal", label: "عادي" },
  { value: "urgent", label: "عاجل" },
];

export default function CreateNoteSection({ project, onCreated }: { project: Project; onCreated: () => void }) {
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState<"contractor" | "owner">("contractor");
  const [priority, setPriority] = useState<PriorityLevel>("normal");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachPhoto = async () => {
    try {
      const path = await pickAndUploadPhoto(`notes/${project.id}`);
      if (path) setPhotoPath(path);
    } catch (e: any) {
      setError(e?.message ?? "تعذّر رفع الصورة");
    }
  };

  const submit = async () => {
    if (!text.trim() || !session?.user) return;
    setSubmitting(true);
    setError(null);
    const assigned_to = assignee === "contractor" ? project.contractor_id : project.owner_id;
    const { error } = await supabase.from("notes").insert({
      project_id: project.id,
      created_by: session.user.id,
      assigned_to,
      priority,
      status: "open",
      note_text: text.trim(),
      photo_url: photoPath,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
    setPhotoPath(null);
    setPriority("normal");
    onCreated();
  };

  return (
    <Card>
      <SectionLabel>رصد ملاحظة جديدة</SectionLabel>
      <Field label="نص الملاحظة" value={text} onChangeText={setText} placeholder="مثال: شرخ في العمود..." multiline />

      <Text style={styles.label}>توجيه إلى</Text>
      <View style={styles.chipRow}>
        {ASSIGNEES.map((a) => (
          <Pressable key={a.value} onPress={() => setAssignee(a.value)} style={[styles.chip, assignee === a.value && styles.chipActive]}>
            <Text style={[styles.chipText, assignee === a.value && styles.chipTextActive]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>الأولوية</Text>
      <View style={styles.chipRow}>
        {PRIORITIES.map((p) => (
          <Pressable key={p.value} onPress={() => setPriority(p.value)} style={[styles.chip, priority === p.value && styles.chipActive]}>
            <Text style={[styles.chipText, priority === p.value && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={attachPhoto} style={styles.photoBtn}>
        <Text style={styles.photoBtnText}>{photoPath ? "✓ تم إرفاق صورة" : "📷 إرفاق صورة (اختياري)"}</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title="حفظ الملاحظة" onPress={submit} loading={submitting} disabled={!text.trim()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "700", color: colors.navySoft, marginTop: spacing.md, marginBottom: 6 },
  chipRow: { flexDirection: "row", gap: 8 },
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
  photoBtn: {
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  photoBtnText: { color: colors.inkSoft, fontSize: 13 },
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.sm },
});
