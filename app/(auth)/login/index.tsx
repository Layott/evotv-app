import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, ChromeIcon } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { FormField } from "@/components/auth/form-field";
import { useMockAuth } from "@/components/providers";

const EVO_LOGO = "https://evotv.vercel.app/evo-logo/evo-tv-152.png";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithSocial } = useMockAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [socialBusy, setSocialBusy] = React.useState<"google" | "apple" | null>(
    null,
  );

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const email = watch("email");
  const password = watch("password");

  const onSubmit = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await signIn(values.email, values.password);
      toast.success("Welcome back to EVO TV", {
        description: `Signed in as ${values.email}`,
      });
      router.replace("/(public)/home");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error("Couldn't sign in", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    if (provider === "apple") {
      toast.info("Apple sign-in coming soon");
      return;
    }
    setSocialBusy(provider);
    try {
      await signInWithSocial(provider);
      toast.success("Welcome to EVO TV");
      router.replace("/(public)/home");
    } catch (err) {
      const code = err instanceof Error ? err.message : "oauth_failed";
      if (code === "oauth_cancelled") {
        // User dismissed the in-app browser; quiet exit.
        return;
      }
      toast.error("Couldn't sign in with Google", { description: code });
    } finally {
      setSocialBusy(null);
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
          <View className="items-center mb-10">
            <Image
              source={{ uri: EVO_LOGO }}
              style={{ width: 64, height: 64, borderRadius: 16 }}
              contentFit="contain"
              transition={200}
            />
          </View>

          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground text-center">
              Welcome back
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-2">
              Sign in to follow your teams, catch lives, and join the chat.
            </Text>
          </View>

          <View className="rounded-2xl border border-border bg-card/40 p-5 gap-4">
            <FormField
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text: string) => setValue("email", text, { shouldValidate: false })}
              error={errors.email?.message}
            />

            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">Password</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <Text className="text-xs font-medium text-brand">Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>
              <FormField
                label=""
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                value={password}
                onChangeText={(text: string) =>
                  setValue("password", text, { shouldValidate: false })
                }
                error={errors.password?.message}
              />
            </View>

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
              className="h-11 w-full bg-brand"
              textClassName="font-semibold text-black"
            >
              {submitting ? (
                <View className="flex-row items-center gap-2">
                  <Spinner color="#000000" />
                  <Text className="text-black font-semibold">Signing in...</Text>
                </View>
              ) : (
                "Sign in"
              )}
            </Button>

            <View className="my-2 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">
                or continue with
              </Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <View className="gap-3">
              <Button
                variant="outline"
                onPress={() => handleSocial("google")}
                disabled={submitting || socialBusy !== null}
                className="h-11 w-full"
              >
                {socialBusy === "google" ? (
                  <Spinner color="#FAFAFA" />
                ) : (
                  <ChromeIcon color="#FAFAFA" size={18} />
                )}
                <Text className="text-sm font-medium text-foreground">
                  {socialBusy === "google" ? "Opening Google…" : "Continue with Google"}
                </Text>
              </Button>
              <Button
                variant="outline"
                onPress={() => handleSocial("apple")}
                disabled={submitting || socialBusy !== null}
                className="h-11 w-full"
              >
                <Apple color="#FAFAFA" size={18} />
                <Text className="text-sm font-medium text-foreground">Continue with Apple</Text>
              </Button>
            </View>
          </View>

          <View className="mt-6 flex-row justify-center items-center gap-1">
            <Text className="text-sm text-muted-foreground">Don&apos;t have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand">Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
