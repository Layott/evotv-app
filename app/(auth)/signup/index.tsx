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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Apple, ChromeIcon } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { FormField, FieldWrapper } from "@/components/auth/form-field";
import { PasswordStrengthMeter } from "@/components/auth/password-strength";
import {
  AFRICAN_COUNTRIES,
  CountrySelect,
} from "@/components/auth/country-select";
import { useMockAuth } from "@/components/providers";

const EVO_LOGO = "https://evotv.vercel.app/evo-logo/evo-tv-152.png";

const countryCodes = AFRICAN_COUNTRIES.map((c) => c.code) as [
  string,
  ...string[],
];

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    handle: z
      .string()
      .min(3, "Handle must be at least 3 characters")
      .max(20, "Handle must be 20 characters or fewer")
      .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    country: z.enum(countryCodes, { message: "Select a country" }),
    acceptTerms: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, signInWithSocial } = useMockAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [socialBusy, setSocialBusy] = React.useState<"google" | "apple" | null>(
    null,
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      handle: "",
      password: "",
      confirmPassword: "",
      country: "NG",
      acceptTerms: false as unknown as true,
    },
  });

  const password = watch("password");
  const country = watch("country");
  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (values: SignupValues) => {
    setSubmitting(true);
    try {
      await signUp({
        email: values.email,
        password: values.password,
        name: values.handle,
        handle: values.handle,
      });
      toast.success("Account created", {
        description: "Check your inbox for a 6-digit code.",
      });
      // Better-Auth's emailOTP plugin auto-sends a verification OTP on
      // sign-up when `sendVerificationOnSignUp: true`. Route the user
      // straight to the OTP screen with their email prefilled.
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: values.email },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-up failed";
      toast.error("Couldn't create account", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    if (provider === "apple") {
      toast.info("Apple sign-up coming soon");
      return;
    }
    setSocialBusy(provider);
    try {
      await signInWithSocial(provider);
      toast.success("Welcome to EVO TV");
      router.replace("/(auth)/onboarding");
    } catch (err) {
      const code = err instanceof Error ? err.message : "oauth_failed";
      if (code === "oauth_cancelled") return;
      toast.error("Couldn't sign up with Google", { description: code });
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
          <View className="mb-6 items-center">
            <Image
              source={{ uri: EVO_LOGO }}
              style={{ width: 56, height: 56, borderRadius: 14 }}
              contentFit="contain"
              transition={200}
            />
          </View>

          <View className="mb-6">
            <Text className="text-center text-2xl font-bold text-foreground">
              Join EVO TV
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Create your account. Esports, anime, and lifestyle creators — all in one place.
            </Text>
          </View>

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

            <Controller
              control={control}
              name="handle"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  label="Handle"
                  placeholder="evopro"
                  autoCapitalize="none"
                  autoComplete="username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  hint="3-20 characters, letters, numbers, underscores."
                  error={errors.handle?.message}
                />
              )}
            />

            <FieldWrapper
              id="password"
              label="Password"
              error={errors.password?.message}
            >
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField
                    label=""
                    placeholder="Enter a password"
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
                  label="Confirm password"
                  placeholder="Re-enter password"
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

            <FieldWrapper
              id="country"
              label="Country"
              error={errors.country?.message}
            >
              <CountrySelect
                value={country || ""}
                onValueChange={(v) =>
                  setValue("country", v as SignupValues["country"], {
                    shouldValidate: true,
                  })
                }
                invalid={!!errors.country}
              />
            </FieldWrapper>

            <View className="flex-row items-start gap-2 pt-1">
              <Checkbox
                checked={!!acceptTerms}
                onCheckedChange={(c) =>
                  setValue(
                    "acceptTerms",
                    (c === true) as unknown as true,
                    { shouldValidate: true },
                  )
                }
                className="mt-0.5"
              />
              <View className="flex-1">
                <Pressable
                  onPress={() =>
                    setValue(
                      "acceptTerms",
                      (!acceptTerms) as unknown as true,
                      { shouldValidate: true },
                    )
                  }
                >
                  <Label className="text-xs leading-snug text-muted-foreground">
                    I agree to the EVO TV terms and privacy policy.
                  </Label>
                </Pressable>
                <View className="mt-1 flex-row gap-3">
                  <Pressable
                    onPress={() => router.push("/(authed)/settings/terms" as never)}
                  >
                    <Text className="text-xs font-semibold text-brand underline">
                      Read Terms
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/(authed)/settings/privacy" as never)}
                  >
                    <Text className="text-xs font-semibold text-brand underline">
                      Read Privacy
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
            {errors.acceptTerms ? (
              <Text className="-mt-2 text-xs" style={{ color: "#f87171" }}>
                {errors.acceptTerms.message}
              </Text>
            ) : null}

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
                    Creating account...
                  </Text>
                </View>
              ) : (
                "Create account"
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
                <Text className="text-sm font-medium text-foreground">
                  Continue with Apple
                </Text>
              </Button>
            </View>
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-muted-foreground">
              Already have an account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-brand">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
