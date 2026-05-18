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
import { Stack, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { ArrowLeft, Loader2, Save } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useMockAuth } from "@/components/providers";
import { getMyProfile, updateMyProfile } from "@/lib/api/me";
import { ApiError } from "@/lib/api/_client";

const BRAND = "#2CD7E3";

const HANDLE_RE = /^[a-zA-Z0-9_]+$/;

export default function ProfileEditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, updateProfile } = useMockAuth();

  const profileQ = useQuery({
    queryKey: ["me", "profile"],
    queryFn: getMyProfile,
  });

  const [name, setName] = React.useState("");
  const [handle, setHandle] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!profileQ.data) return;
    setName(profileQ.data.name ?? "");
    setHandle(profileQ.data.handle ?? "");
    setBio(profileQ.data.bio ?? "");
    setCountry(profileQ.data.country ?? "NG");
  }, [profileQ.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const patch: Record<string, string> = {};
      const initial = profileQ.data;
      if (!initial) return null;
      if (name !== (initial.name ?? "")) patch.name = name;
      if (handle !== (initial.handle ?? "")) patch.handle = handle;
      if (bio !== (initial.bio ?? "")) patch.bio = bio;
      if (country !== (initial.country ?? "")) patch.country = country;
      if (Object.keys(patch).length === 0) return null;
      return await updateMyProfile(patch);
    },
    onSuccess: (fresh) => {
      if (!fresh) {
        toast.success("No changes to save");
        return;
      }
      updateProfile({
        handle: fresh.handle ?? "",
        displayName: fresh.name,
        bio: fresh.bio,
        country: fresh.country,
      });
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
      toast.success("Profile updated");
      router.back();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ handle: "Handle already taken" });
        toast.error("Handle already taken");
        return;
      }
      if (err instanceof ApiError && err.status === 422) {
        toast.error("Check the form — some fields are invalid");
        return;
      }
      toast.error("Couldn't save profile", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (name.length > 80) e.name = "Name too long (max 80)";
    if (!handle.trim()) e.handle = "Handle is required";
    else if (handle.length < 3) e.handle = "Min 3 characters";
    else if (handle.length > 20) e.handle = "Max 20 characters";
    else if (!HANDLE_RE.test(handle))
      e.handle = "Letters, numbers, underscores only";
    if (bio.length > 280) e.bio = "Bio too long (max 280)";
    if (country.length > 64) e.country = "Country too long";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSave() {
    if (!validate()) return;
    saveMutation.mutate();
  }

  if (!user || profileQ.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  if (!profileQ.data) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center bg-background px-6">
          <Text className="text-foreground text-base font-semibold">
            Couldn't load profile
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground text-center">
            Sign in again or check your connection.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-xl px-4 py-2.5"
            style={{ backgroundColor: BRAND }}
          >
            <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 13 }}>
              Back
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit profile", headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-background"
      >
        <View className="flex-row items-center gap-3 px-4 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
          >
            <ArrowLeft color="#FAFAFA" size={18} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">
            Edit profile
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 64 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Display name" error={errors.name}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#525252"
              maxLength={80}
              autoCapitalize="words"
              style={inputStyle}
            />
          </Field>

          <Field
            label="Handle"
            hint="3-20 characters, letters, numbers, underscores."
            error={errors.handle}
          >
            <TextInput
              value={handle}
              onChangeText={(v) => setHandle(v.toLowerCase())}
              placeholder="yourhandle"
              placeholderTextColor="#525252"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
              style={inputStyle}
            />
          </Field>

          <Field
            label="Bio"
            hint={`${bio.length} / 280 characters`}
            error={errors.bio}
          >
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people what you're about."
              placeholderTextColor="#525252"
              maxLength={280}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[inputStyle, { minHeight: 96, paddingTop: 12 }]}
            />
          </Field>

          <Field label="Country" error={errors.country}>
            <TextInput
              value={country}
              onChangeText={(v) => setCountry(v.toUpperCase())}
              placeholder="NG"
              placeholderTextColor="#525252"
              maxLength={64}
              autoCapitalize="characters"
              autoCorrect={false}
              style={inputStyle}
            />
          </Field>

          <View className="mt-6 flex-row gap-2">
            <Button
              variant="outline"
              size="lg"
              onPress={() => router.back()}
              className="flex-1 border-border"
              disabled={saveMutation.isPending}
            >
              <Text className="text-sm font-medium text-foreground">
                Cancel
              </Text>
            </Button>
            <Pressable
              onPress={onSave}
              disabled={saveMutation.isPending}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 active:opacity-80"
              style={{
                backgroundColor: BRAND,
                opacity: saveMutation.isPending ? 0.6 : 1,
              }}
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} color="#0a0a0a" />
              ) : (
                <Save size={16} color="#0a0a0a" />
              )}
              <Text style={{ color: "#0a0a0a", fontWeight: "700", fontSize: 14 }}>
                {saveMutation.isPending ? "Saving…" : "Save changes"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-5 gap-1.5">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      {children}
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#27272a",
  backgroundColor: "#0f0f0f",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: "#fafafa",
  fontSize: 14,
} as const;
