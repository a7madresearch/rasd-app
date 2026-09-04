import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { Card, SectionLabel } from "../../components/ui";
import { colors, spacing } from "../../theme/tokens";
import type { ConsultantVisit, ContractorUpdate, Project } from "../../types/database";

export default function LatestStatusCard({ project }: { project: Project }) {
  const [update, setUpdate] = useState<ContractorUpdate | null>(null);
  const [visit, setVisit] = useState<ConsultantVisit | null>(null);

  const load = useCallback(async () => {
    const [{ data: updates }, { data: visits }] = await Promise.all([
      supabase
        .from("contractor_updates")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("consultant_visits")
        .select("*")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setUpdate((updates?.[0] as ContractorUpdate) ?? null);
    setVisit((visits?.[0] as ConsultantVisit) ?? null);
  }, [project.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.row}>
      <Card style={styles.stat}>
        <Text style={styles.label}>آخر إنجاز (مقاول)</Text>
        <Text style={styles.value}>{update?.completion_pct != null ? `${update.completion_pct}%` : "—"}</Text>
        {update?.phase && <Text style={styles.sub}>{update.phase}</Text>}
      </Card>
      <Card style={styles.stat}>
        <Text style={styles.label}>آخر إنجاز موثّق (استشاري)</Text>
        <Text style={[styles.value, { color: colors.navy }]}>{visit?.verified_pct != null ? `${visit.verified_pct}%` : "—"}</Text>
        {visit?.visit_date && <Text style={styles.sub}>{visit.visit_date}</Text>}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, alignItems: "center" },
  label: { fontSize: 11, color: colors.inkSoft, textAlign: "center" },
  value: { fontSize: 24, fontWeight: "800", color: colors.orange, marginTop: 4, fontFamily: "monospace" },
  sub: { fontSize: 11, color: colors.inkSoft, marginTop: 4, textAlign: "center" },
});
