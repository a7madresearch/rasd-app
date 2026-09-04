import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { colors, spacing } from "../theme/tokens";
import type { AppStackParamList } from "../navigation/AppNavigator";
import type { Project } from "../types/database";
import ContractorScreen from "./contractor/ContractorScreen";
import ConsultantScreen from "./consultant/ConsultantScreen";
import OwnerDashboardScreen from "./owner/OwnerDashboardScreen";

type Props = NativeStackScreenProps<AppStackParamList, "Project">;

export default function ProjectScreen({ route }: Props) {
  const { projectId } = route.params;
  const { session } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
    if (error) setError(error.message);
    else setProject(data as Project);
    setLoading(false);
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "تعذّر تحميل المشروع"}</Text>
      </View>
    );
  }

  const uid = session?.user?.id;
  if (uid === project.contractor_id) {
    return <ContractorScreen project={project} />;
  }
  if (uid === project.consultant_id) {
    return <ConsultantScreen project={project} />;
  }
  // owner (or anyone else who somehow matched the query) sees the dashboard
  return <OwnerDashboardScreen project={project} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper, padding: spacing.lg },
  error: { color: colors.orange, textAlign: "center" },
});
