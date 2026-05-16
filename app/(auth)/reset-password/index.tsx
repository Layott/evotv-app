import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormField, FieldWrapper } from "@/components/auth/form-field";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import { BASE_URL } from "@/lib/api/_client";

const schema = z
  .object({
    otp: z.string().length(6, "Enter the 6-digit code"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  // `email` arrives from the forgot-password redirect. Legacy `token` deep
  // links still parse cleanly but the OTP flow ignores them.
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (values: Values) => {
    if (!params.email) {
      setServerError("Missing email. Restart the reset flow.");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(
        `${BASE_URL}/api/auth/email-otp/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: params.email,
            otp: values.otp,
            password: values.password,
          }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          (body as { message?: string } | null)?.message ??
          "Invalid or expired code";
        setServerError(msg);
        toast.error("Reset failed", { description: msg });
        return;
      }
      toast.success("Password updated", {
        description: "Sign in with your new password.",
      });
      router.replace("/(auth)/login");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setServerError(msg);
      toast.error("Reset failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="grow justify-center px-6 py-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 items-center gap-3">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "rgba(44,215,227,0.10)",
                borderWidth: 1,
                borderColor: "rgba(44,215,227,0.30)",
              }}
            >
              <ShieldCheck color="#2CD7E3" size={26} />
            </View>
            <Text className="text-center text-2xl font-bold text-foreground">
              Set a new password
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              Enter the 6-digit code we sent to{" "}
              <Text className="font-mono font-semibold text-foreground">
                {params.email ?? "your inbox"}
              </Text>
              , then pick a new password.
            </Text>
          </View>

          <View className="gap-4 rounded-2xl border border-border bg-card/40 p-5">
            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="6-digit code"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
                  onBlur={onBlur}
                  error={errors.otp?.message}
                />
              )}
            />

            <FieldWrapper
              id="password"
              label="New password"
              error={errors.password?.message}
            >
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label=""
                    placeholder="Enter new password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              <PasswordStrengthMeter
                password={password || ""}
                className="pt-1"
              />
            </FieldWrapper>

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Confirm new password"
                  placeholder="Re-enter new password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
              className="h-11 w-full bg-brand"
              textClassName="font-semibold text-black"
            >
              {submitting ? (
                <View className="flex-row items-center gap-2">
                  <Spinner color="#000000" />
                  <Text className="font-semibold text-black">
                    Updating...
                  </Text>
                </View>
              ) : (
                "Update password"
              )}
            </Button>

            {serverError ? (
              <Text className="text-center text-xs" style={{ color: "#f87171" }}>
                {serverError}
              </Text>
            ) : null}
          </View>

          <View className="mt-6 items-center">
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand">
                  Back to sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
