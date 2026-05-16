import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/auth/form-field";
import { BASE_URL } from "@/lib/api/_client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: Values) => {
    setSubmitting(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/auth/email-otp/send-verification-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            type: "forget-password",
          }),
        },
      );
      if (!res.ok) {
        // Better-Auth returns 200 even when the email doesn't exist to avoid
        // enumeration; treat any non-2xx as transient/network for the user.
        toast.error("Couldn't send reset code", {
          description: "Try again in a moment.",
        });
        return;
      }
      setSent(true);
      toast.success("Reset code sent", {
        description: `Check ${values.email} for a 6-digit code.`,
      });
      setTimeout(
        () =>
          router.replace({
            pathname: "/(auth)/reset-password",
            params: { email: values.email },
          }),
        1200,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast.error("Couldn't send reset code", { description: msg });
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
              {sent ? (
                <CheckCircle2 color="#2CD7E3" size={26} />
              ) : (
                <KeyRound color="#2CD7E3" size={26} />
              )}
            </View>
            <Text className="text-center text-2xl font-bold text-foreground">
              {sent ? "Check your inbox" : "Reset your password"}
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              {sent
                ? "We sent you a link to reset your password. Redirecting to sign in..."
                : "Enter your email and we'll send you a password reset link."}
            </Text>
          </View>

          {!sent ? (
            <View className="gap-4 rounded-2xl border border-border bg-card/40 p-5">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label="Email"
                    placeholder="you@example.com"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
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
                      Sending link...
                    </Text>
                  </View>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </View>
          ) : null}

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-muted-foreground">
              Remembered it?
            </Text>
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
