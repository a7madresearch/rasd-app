import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { colors, spacing } from "../theme/tokens";
import type { AppStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "CreateProject">;

export default function CreateProjectScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contractorEmail, setContractorEmail] = useState("");
  const [consultantEmail, setConsultantEmail] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !contractorEmail.trim() || !consultantEmail.trim()) {
      setError("عبّئ اسم المشروع وبريد المقاول والاستشاري");
      return;
    }
    if (!session?.user) return;
    setLoading(true);

    const { data: matches, error: lookupError } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("role", ["contractor", "consultant"]);

    if (lookupError) {
      setError(lookupError.message);
      setLoading(false);
      return;
    }

    // profiles has no email — we ask the owner to enter the exact registered name
    // as a pragmatic v1 workaround until an email-lookup RPC is added server-side.
    const contractor = matches?.find(
      (m) => m.role === "contractor" && m.name.trim().toLowerCase() === contractorEmail.trim().toLowerCase()
    );
    const consultant = matches?.find(
      (m) => m.role === "consultant" && m.name.trim().toLowerCase() === consultantEmail.trim().toLowerCase()
    );

    if (!contractor || !consultant) {
      setError("تعذّر إيجاد المقاول أو الاستشاري بهذا الاسم — تأكد أن لديهما حساباً مسجّلاً بنفس الاسم بالضبط.");
      setLoading(false);
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        location: location.trim() || null,
        owner_id: session.user.id,
        contractor_id: contractor.id,
        consultant_id: consultant.id,
        contract_value: contractValue ? Number(contractValue) : null,
        status: "active",
      })
      .select()
      .single();

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    navigation.replace("Project", { projectId: created.id, projectName: created.name });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>
        ملاحظة: المقاول والاستشاري يجب أن يكون لديهما حساب مسجّل مسبقاً بنفس الاسم الذي أدخلاه عند التسجيل.
      </Text>
      <Field label="اسم المشروع" value={name} onChangeText={setName} placeholder="برج الواحة السكني" />
      <Field label="الموقع" value={location} onChangeText={setLocation} placeholder="أبوظبي — جزيرة الريم" />
      <Field
        label="اسم المقاول (كما سجّل به حسابه)"
        value={contractorEmail}
        onChangeText={setContractorEmail}
        placeholder="شركة البنّاء المتقدم"
      />
      <Field
        label="اسم الاستشاري (كما سجّل به حسابه)"
        value={consultantEmail}
        onChangeText={setConsultantEmail}
        placeholder="مكتب الهندسة الاستشارية"
      />
      <Field
        label="قيمة العقد (اختياري)"
        value={contractValue}
        onChangeText={setContractValue}
        keyboardType="numeric"
        placeholder="48500000"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title="إنشاء المشروع" onPress={onSubmit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, backgroundColor: colors.paper, flexGrow: 1 },
  hint: { fontSize: 12, color: colors.inkSoft, marginBottom: spacing.md, lineHeight: 18 },
  error: { color: colors.orange, fontSize: 12.5, marginTop: spacing.md, textAlign: "center" },
});
