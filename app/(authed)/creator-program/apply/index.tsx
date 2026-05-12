import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Mic2,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { useMockAuth } from "@/components/providers";
import { useQuery } from "@tanstack/react-query";
import { listGames } from "@/lib/api/games";
import {
  getMyApplication,
  submitApplication,
  type CreatorApplication,
} from "@/lib/mock/creators";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FieldWrapper } from "@/components/auth/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "KE", label: "Kenya" },
  { code: "GH", label: "Ghana" },
  { code: "MA", label: "Morocco" },
  { code: "EG", label: "Egypt" },
  { code: "TZ", label: "Tanzania" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "UG", label: "Uganda" },
  { code: "SN", label: "Senegal" },
  { code: "DZ", label: "Algeria" },
  { code: "TN", label: "Tunisia" },
  { code: "OTHER", label: "Other" },
];

const SOCIAL_PLATFORMS: Array<{
  value: CreatorApplication["socialPlatform"];
  label: string;
}> = [
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "tiktok", label: "TikTok" },
  { value: "kick", label: "Kick" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { id: "about", label: "About you" },
  { id: "audience", label: "Audience proof" },
  { id: "review", label: "Review & submit" },
] as const;

const applicationSchema = z.object({
  bio: z.string().trim().min(20, "Bio must be at least 20 characters"),
  country: z.string().min(1, "Country required"),
  primaryGameId: z.string().min(1, "Game required"),
  socialPlatform: z.enum(["youtube", "twitch", "tiktok", "kick", "other"]),
  socialHandle: z.string().trim().min(1, "Handle is required"),
  followerCount: z
    .number({ invalid_type_error: "Enter a number" })
    .int()
    .min(0, "Cannot be negative"),
  agreement: z.literal(true, { message: "You must accept the terms" }),
});

type FormValues = z.infer<typeof applicationSchema>;

export default function CreatorProgramApplyScreen() {
  const router = useRouter();
  const { user } = useMockAuth();
  const [stepIdx, setStepIdx] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(true);

  const gamesQ = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const games = gamesQ.data ?? [];

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      bio: "",
      country: "NG",
      primaryGameId: "",
      socialPlatform: "youtube",
      socialHandle: "",
      followerCount: 0,
      agreement: false as unknown as true,
    },
    mode: "onChange",
  });

  const values = watch();

  React.useEffect(() => {
    if (gamesQ.data && gamesQ.data[0] && !values.primaryGameId) {
      setValue("primaryGameId", gamesQ.data[0].id);
    }
  }, [gamesQ.data, values.primaryGameId, setValue]);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const existing = await getMyApplication(user.id);
      if (cancelled) return;
      if (existing) {
        toast("You've already applied — viewing status");
        router.replace("/(authed)/creator-program/thanks");
        return;
      }
      setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  if (!user || bootstrapping || gamesQ.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Apply" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  async function next() {
    let valid = false;
    if (stepIdx === 0) {
      valid = await trigger(["bio", "country", "primaryGameId"]);
    } else if (stepIdx === 1) {
      valid = await trigger(["socialPlatform", "socialHandle", "followerCount"]);
    } else {
      valid = true;
    }
    if (valid) {
      setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
    }
  }

  function back() {
    setStepIdx((i) => Math.max(0, i - 1));
  }

  async function onSubmit(formValues: FormValues) {
    if (submitting) return;
    setSubmitting(true);
    const result = await submitApplication({
      userId: user!.id,
      bio: formValues.bio,
      country: formValues.country,
      primaryGameId: formValues.primaryGameId,
      socialPlatform: formValues.socialPlatform,
      socialHandle: formValues.socialHandle,
      followerCount: formValues.followerCount,
      agreementAccepted: !!formValues.agreement,
    });
    if (!result.success) {
      toast.error(result.reason ?? "Could not submit");
      setSubmitting(false);
      return;
    }
    toast.success("Application submitted!", {
      description: "We'll get back within 5 working days.",
    });
    router.push("/(authed)/creator-program/thanks");
  }

  const step = STEPS[stepIdx]!;

  return (
    <>
      <Stack.Screen options={{ title: "Apply" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 bg-background"
          contentContainerClassName="px-4 py-6 pb-24"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-4 flex-row items-center gap-3">
            <Pressable
              onPress={() => router.push("/(authed)/creator-program")}
              className="h-9 w-9 items-center justify-center rounded-md border border-border bg-card"
              accessibilityRole="button"
              accessibilityLabel="Back to creator program"
            >
              <ArrowLeft size={16} color="#FAFAFA" />
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Mic2 size={18} color="#FCD34D" />
                <Text className="text-lg font-bold text-foreground">
                  Creator program application
                </Text>
              </View>
              <Text className="text-sm text-muted-foreground">
                Three quick steps. Takes about 2 minutes.
              </Text>
            </View>
          </View>

          <Stepper currentIdx={stepIdx} />

          <View className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
            {step.id === "about" ? (
              <View className="gap-4">
                <FieldWrapper
                  id="bio"
                  label="Tell us about yourself"
                  error={errors.bio?.message}
                  hint={`${(values.bio ?? "").trim().length} / 20 characters minimum`}
                >
                  <Controller
                    control={control}
                    name="bio"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Textarea
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="What do you stream? Why EVO? Anything we should know?"
                        className="min-h-[120px] border-border"
                      />
                    )}
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="country"
                  label="Country"
                  error={errors.country?.message}
                >
                  <Controller
                    control={control}
                    name="country"
                    render={({ field: { onChange, value } }) => (
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="primaryGame"
                  label="Primary game"
                  error={errors.primaryGameId?.message}
                >
                  <Controller
                    control={control}
                    name="primaryGameId"
                    render={({ field: { onChange, value } }) => (
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select game" />
                        </SelectTrigger>
                        <SelectContent>
                          {games.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.shortName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>
              </View>
            ) : null}

            {step.id === "audience" ? (
              <View className="gap-4">
                <FieldWrapper
                  id="platform"
                  label="Platform"
                  error={errors.socialPlatform?.message}
                >
                  <Controller
                    control={control}
                    name="socialPlatform"
                    render={({ field: { onChange, value } }) => (
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>

                <Controller
                  control={control}
                  name="socialHandle"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Handle / channel URL"
                      placeholder="@yourname or full URL"
                      autoCapitalize="none"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.socialHandle?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="followerCount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Follower / subscriber count"
                      placeholder="e.g. 12500"
                      keyboardType="number-pad"
                      value={String(value ?? "")}
                      onChangeText={(t) => {
                        const cleaned = t.replace(/[^0-9]/g, "");
                        onChange(cleaned === "" ? 0 : parseInt(cleaned, 10));
                      }}
                      onBlur={onBlur}
                      hint="Don't worry about exact numbers — we'll verify on review."
                      error={errors.followerCount?.message}
                    />
                  )}
                />

                <View className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <View className="flex-row items-start gap-2">
                    <ExternalLink size={12} color="#FCD34D" style={{ marginTop: 2 }} />
                    <Text className="flex-1 text-xs text-amber-200">
                      Make sure your channel handle is public so our reviewer can verify watch hours.
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {step.id === "review" ? (
              <View className="gap-4">
                <Text className="text-sm font-semibold text-foreground">
                  Review your application
                </Text>
                <View className="overflow-hidden rounded-lg border border-border">
                  <ReviewRow label="Bio">{values.bio || "—"}</ReviewRow>
                  <ReviewRow label="Country">
                    {COUNTRIES.find((c) => c.code === values.country)?.label ??
                      values.country}
                  </ReviewRow>
                  <ReviewRow label="Primary game">
                    {games.find((g) => g.id === values.primaryGameId)?.shortName ??
                      values.primaryGameId}
                  </ReviewRow>
                  <ReviewRow label="Platform">
                    {SOCIAL_PLATFORMS.find(
                      (p) => p.value === values.socialPlatform,
                    )?.label ?? values.socialPlatform}
                  </ReviewRow>
                  <ReviewRow label="Handle">{values.socialHandle}</ReviewRow>
                  <ReviewRow label="Followers" last>
                    {(values.followerCount || 0).toLocaleString()}
                  </ReviewRow>
                </View>
                <View className="flex-row items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
                  <Controller
                    control={control}
                    name="agreement"
                    render={({ field: { onChange, value } }) => (
                      <Checkbox
                        checked={!!value}
                        onCheckedChange={(v) =>
                          onChange((v === true) as unknown as true)
                        }
                        className="mt-0.5"
                      />
                    )}
                  />
                  <Text className="flex-1 text-xs text-muted-foreground">
                    I agree to the EVO TV Creator Agreement, including the 70/30 revenue split, content guidelines, and payout terms. I confirm the information above is accurate.
                  </Text>
                </View>
                {errors.agreement ? (
                  <Text className="text-xs" style={{ color: "#f87171" }}>
                    {errors.agreement.message}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="mt-6 flex-row items-center justify-between">
              <Button
                variant="outline"
                onPress={back}
                disabled={stepIdx === 0 || submitting}
              >
                <ArrowLeft size={14} color="#FAFAFA" />
                <Text className="text-sm font-medium text-foreground">Back</Text>
              </Button>
              {stepIdx < STEPS.length - 1 ? (
                <Button onPress={next} className="bg-sky-500">
                  <Text className="text-sm font-semibold text-neutral-950">
                    Next
                  </Text>
                  <ArrowRight size={14} color="#0A0A0A" />
                </Button>
              ) : (
                <Button
                  onPress={handleSubmit(onSubmit)}
                  disabled={submitting}
                  className="bg-amber-500"
                >
                  {submitting ? (
                    <Spinner color="#451A03" />
                  ) : (
                    <Check size={16} color="#451A03" />
                  )}
                  <Text className="text-sm font-semibold text-amber-950">
                    Submit application
                  </Text>
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Stepper({ currentIdx }: { currentIdx: number }) {
  return (
    <View className="flex-row items-center gap-2">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "h-7 w-7 items-center justify-center rounded-full",
                i < currentIdx
                  ? "bg-emerald-500"
                  : i === currentIdx
                  ? "bg-sky-500"
                  : "bg-secondary",
              )}
            >
              {i < currentIdx ? (
                <Check size={14} color="#022C22" />
              ) : (
                <Text
                  className={cn(
                    "text-xs font-bold",
                    i === currentIdx
                      ? "text-neutral-950"
                      : "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              className={cn(
                "text-[11px] font-medium",
                i === currentIdx
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {s.label}
            </Text>
          </View>
          {i < STEPS.length - 1 ? (
            <View
              className={cn(
                "h-px flex-1",
                i < currentIdx ? "bg-emerald-500/40" : "bg-border",
              )}
            />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

function ReviewRow({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-start bg-background px-3 py-2.5",
        !last && "border-b border-border",
      )}
    >
      <View className="w-32">
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </Label>
      </View>
      <View className="flex-1">
        {typeof children === "string" || typeof children === "number" ? (
          <Text className="text-sm text-foreground">{String(children)}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
