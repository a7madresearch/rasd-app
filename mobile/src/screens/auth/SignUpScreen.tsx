import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { Field, PrimaryButton, SecondaryButton } from "../../components/ui";
import { colors, radius, spacing } from "../../theme/tokens";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import type { UserRole } from "../../types/database";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

const ROLES: { value: UserRole; label: string }[] = [
  { value: "owner", label: "مالك" },
  { value: "contractor", label: "مقاول" },
  { value: "consultant", label: "استشاري" },
];

export default function SignUpScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("تأكد من تعبئة الاسم والبريد وكلمة مرور 6 أحرف فأكثر");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, name.trim(), role);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={styles.title}>تم إنشاء الحساب</Text>
        <Text style={styles.subtitle}>
          إذا كان تأكيد البريد الإلكتروني مفعّلاً في مشروع Supabase، تحقق من بريدك قبل تسجيل الدخول.
        </Text>
        <PrimaryButton title="الذهاب لتسجيل الدخول" onPress={() => navigation.navigate("Login")} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>إنشاء حساب</Text>

        <Field label="الاسم" value={name} onChangeText={setName} placeholder="اسمك الكامل" />
        <Field
          label="البريد الإلكتروني"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
        />
        <Field label="كلمة المرور" secureTextEntry value={password} onChangeText={setPassword} placeholder="6 أحرف فأكثر" />

        <Text style={styles.label}>الدور</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              style={[styles.roleChip, role === r.value && styles.roleChipActive]}
            >
              <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton title="إنشاء الحساب" onPress={onSubmit} loading={loading} />
        <SecondaryButton title="لديك حساب؟ سجّل الدخول" onPress={() => navigation.navigate("Login")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: colors.paper },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navySoft,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  roleRow: { flexDirection: "row", gap: 8 },
  roleChip: {
    flex: 1,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  roleChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  roleChipText: { color: colors.ink, fontWeight: "600", fontSize: 13 },
  roleChipTextActive: { color: colors.white },
  error: {
    color: colors.orange,
    fontSize: 12.5,
    marginTop: 10,
    textAlign: "center",
  },
});
