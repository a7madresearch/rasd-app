import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { Field, PrimaryButton, SecondaryButton } from "../../components/ui";
import { colors } from "../../theme/tokens";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>رصد</Text>
        <Text style={styles.subtitle}>منصة متابعة المشاريع الإنشائية</Text>

        <Field
          label="البريد الإلكتروني"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
        />
        <Field
          label="كلمة المرور"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton title="تسجيل الدخول" onPress={onSubmit} loading={loading} />
        <SecondaryButton title="إنشاء حساب جديد" onPress={() => navigation.navigate("SignUp")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  error: {
    color: colors.orange,
    fontSize: 12.5,
    marginTop: 10,
    textAlign: "center",
  },
});
