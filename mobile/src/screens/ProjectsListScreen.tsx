import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Card, PrimaryButton, SecondaryButton } from "../components/ui";
import { colors, spacing } from "../theme/tokens";
import type { AppStackParamList } from "../navigation/AppNavigator";
import type { Project } from "../types/database";

type Props = NativeStackScreenProps<AppStackParamList, "ProjectsList">;

export default function ProjectsListScreen({ navigation }: Props) {
  const { session, profile, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setError(null);
    const uid = session.user.id;
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .or(`owner_id.eq.${uid},contractor_id.eq.${uid},consultant_id.eq.${uid}`)
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const myRoleIn = (p: Project) => {
    const uid = session?.user?.id;
    if (p.owner_id === uid) return "مالك";
    if (p.contractor_id === uid) return "مقاول";
    if (p.consultant_id === uid) return "استشاري";
    return "";
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <>
            {profile && (
              <Text style={styles.hello}>
                مرحباً {profile.name} — {roleLabel(profile.role)}
              </Text>
            )}
            {error && <Text style={styles.error}>{error}</Text>}
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>لا توجد مشاريع بعد. أنشئ مشروعاً جديداً إن كنت مالكاً.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("Project", { projectId: item.id, projectName: item.name })}
          >
            <Card>
              <Text style={styles.projectName}>{item.name}</Text>
              {!!item.location && <Text style={styles.projectLocation}>{item.location}</Text>}
              <View style={styles.rowBetween}>
                <Text style={styles.roleTag}>{myRoleIn(item)}</Text>
                <Text style={styles.statusTag}>{statusLabel(item.status)}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
      <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}>
        <PrimaryButton title="+ مشروع جديد" onPress={() => navigation.navigate("CreateProject")} />
        <SecondaryButton title="تسجيل الخروج" onPress={signOut} />
      </View>
    </View>
  );
}

function roleLabel(role: string) {
  return role === "owner" ? "مالك" : role === "contractor" ? "مقاول" : "استشاري";
}

function statusLabel(status: string) {
  return status === "active" ? "نشط" : status === "completed" ? "مكتمل" : "متوقف";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  hello: { fontSize: 15, fontWeight: "700", color: colors.navy, marginBottom: spacing.md },
  error: { color: colors.orange, marginBottom: spacing.md },
  empty: { color: colors.inkSoft, textAlign: "center", marginTop: 40 },
  projectName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  projectLocation: { fontSize: 12.5, color: colors.inkSoft, marginTop: 2 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  roleTag: { fontSize: 11.5, fontWeight: "700", color: colors.navySoft },
  statusTag: { fontSize: 11.5, color: colors.inkSoft },
});
