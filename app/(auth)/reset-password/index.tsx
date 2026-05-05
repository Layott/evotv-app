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

const schema = z
  .object({
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
  // Token may arrive via deep link query (e.g. evotv://reset-password?token=…).
  // We don't validate it locally — Phase F mock just accepts the new password.
  const params = useLocalSearchParams<{ token?: string }>();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async (_values: Values) => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Password updated", {
        description: "Sign in with your new password.",
      });
      router.replace("/(auth)/login");
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
              Pick something strong. You'll use it for every sign-in.
            </Text>
            {params.token ? (
              <Text className="text-[10px] text-muted-foreground">
                Reset token applied.
              </Text>
            ) : null}
          </View>

          <View className="gap-4 rounded-2xl border border-border bg-card/40 p-5">
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
