import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Mail } from "lucide-react-native";
import { toast } from "sonner-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const DEFAULT_EMAIL = "ade***@gmail.com";
const RESEND_COOLDOWN = 30;
const OTP_LENGTH = 6;

/**
 * Hand-rolled 6-digit OTP entry.
 * Single hidden TextInput captures input; the boxes are decorative + tap targets.
 * Web uses shadcn input-otp; the RN twin's input-otp is a stub, so we render inline.
 */
function OtpInput({
  value,
  onChange,
  onSubmitEditing,
  hasError,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmitEditing?: () => void;
  hasError?: boolean;
  disabled?: boolean;
}) {
  const ref = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
    onChange(digits);
  };

  const slots = Array.from({ length: OTP_LENGTH }, (_, i) => i);

  return (
    <View className="w-full items-center">
      <Pressable onPress={() => ref.current?.focus()}>
        <View className="flex-row gap-2">
          {slots.map((i) => {
            const char = value[i] ?? "";
            const isActive = focused && i === Math.min(value.length, OTP_LENGTH - 1);
            return (
              <View
                key={i}
                className="h-12 w-10 items-center justify-center rounded-md"
                style={{
                  backgroundColor: "#0A0A0A",
                  borderWidth: 1,
                  borderColor: hasError
                    ? "#ef4444"
                    : isActive
                      ? "#2CD7E3"
                      : "#262626",
                }}
              >
                <Text className="text-lg font-semibold text-foreground">
                  {char}
                </Text>
              </View>
            );
          })}
        </View>
      </Pressable>

      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        editable={!disabled}
        onSubmitEditing={onSubmitEditing}
        // Visually hidden but still focusable — capture all input here.
        style={{
          position: "absolute",
          opacity: 0,
          height: 1,
          width: 1,
          left: 0,
          top: 0,
        }}
      />
    </View>
  );
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email && params.email.length > 0 ? params.email : DEFAULT_EMAIL;

  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(RESEND_COOLDOWN);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(
      () => setCooldown((c) => (c > 0 ? c - 1 : 0)),
      1000,
    );
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async () => {
    setError(null);
    if (code.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Email verified");
      router.replace("/(auth)/onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(RESEND_COOLDOWN);
    toast.success("Verification code resent", {
      description: `Sent to ${email}`,
    });
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
              <Mail color="#2CD7E3" size={26} />
            </View>
            <Text className="text-center text-2xl font-bold text-foreground">
              Verify your email
            </Text>
            <Text className="text-center text-sm text-muted-foreground">
              We sent a 6-digit code to{" "}
              <Text className="font-mono font-semibold text-foreground">
                {email}
              </Text>
            </Text>
          </View>

          <View className="gap-6 rounded-2xl border border-border bg-card/40 p-5">
            <View className="items-center gap-3">
              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  setError(null);
                }}
                onSubmitEditing={handleSubmit}
                hasError={!!error}
                disabled={submitting}
              />
              {error ? (
                <Text className="text-xs" style={{ color: "#f87171" }}>
                  {error}
                </Text>
              ) : null}
            </View>

            <Button
              onPress={handleSubmit}
              disabled={submitting || code.length !== OTP_LENGTH}
              className="h-11 w-full bg-brand"
              textClassName="font-semibold text-black"
            >
              {submitting ? (
                <View className="flex-row items-center gap-2">
                  <Spinner color="#000000" />
                  <Text className="font-semibold text-black">
                    Verifying...
                  </Text>
                </View>
              ) : (
                "Verify email"
              )}
            </Button>

            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-sm text-muted-foreground">
                Didn't get it?
              </Text>
              {cooldown > 0 ? (
                <Text className="text-sm text-muted-foreground">
                  Resend in {cooldown}s
                </Text>
              ) : (
                <Pressable onPress={handleResend}>
                  <Text className="text-sm font-semibold text-brand">
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          <Text className="mt-4 text-center text-xs text-muted-foreground">
            Tip: in local mode any 6-digit code will verify.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
