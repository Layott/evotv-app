import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Mail, Palette, Save, ToggleLeft } from "lucide-react-native";
import { toast } from "sonner-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listFlags, setFlag } from "@/lib/mock/flags";
import { saveEmailTemplate } from "@/lib/mock/admin";
import type { FeatureFlag } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeader } from "./page-header";

const EMAIL_TEMPLATES: Record<string, { label: string; body: string }> = {
  welcome: {
    label: "Welcome",
    body: `# Welcome to EVO TV

Hey **{{firstName}}**,

Thanks for joining the home of African esports.

See you on stream,
The EVO TV Team`,
  },
  verify_email: {
    label: "Verify email",
    body: `# Verify your email

Click the link below within 24 hours to verify {{email}}:

{{verifyUrl}}`,
  },
  password_reset: {
    label: "Password reset",
    body: `# Reset your password

We received a request to reset the password for **{{email}}**.

Reset link: {{resetUrl}}`,
  },
  subscription_receipt: {
    label: "Subscription receipt",
    body: `# Subscription receipt

Plan: **EVO Premium**
Amount: **{{amountNgn}}**`,
  },
  go_live: {
    label: "Go-live notification",
    body: `# {{streamerName}} just went live

**{{title}}** is streaming now.

Watch: {{streamUrl}}`,
  },
};

export function AdminSettingsPage() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <PageHeader
          title="Settings"
          description="Feature flags, branding and email templates."
        />

        <Tabs defaultValue="flags">
          <TabsList className="mb-4">
            <TabsTrigger value="flags">
              <ToggleLeft size={12} color="#A3A3A3" />
              Flags
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette size={12} color="#A3A3A3" />
              Brand
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail size={12} color="#A3A3A3" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flags">
            <FeatureFlagsSection />
          </TabsContent>
          <TabsContent value="branding">
            <BrandingSection />
          </TabsContent>
          <TabsContent value="email">
            <EmailTemplatesSection />
          </TabsContent>
        </Tabs>
      </ScrollView>
    </View>
  );
}

function FeatureFlagsSection() {
  const qc = useQueryClient();
  const flagsQ = useQuery<FeatureFlag[]>({
    queryKey: ["admin", "flags"],
    queryFn: listFlags,
  });

  async function onToggle(key: string, enabled: boolean) {
    await setFlag(key, enabled);
    qc.setQueryData<FeatureFlag[]>(["admin", "flags"], (prev) =>
      (prev ?? []).map((f) => (f.key === key ? { ...f, enabled } : f)),
    );
    toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
  }

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card/40">
      <View className="border-b border-border p-4">
        <Text className="text-sm font-semibold text-foreground">
          Feature flags
        </Text>
        <Text className="text-xs text-muted-foreground">
          Toggle product features at runtime.
        </Text>
      </View>
      {flagsQ.isLoading
        ? Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="border-b border-border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-44" />
            </View>
          ))
        : (flagsQ.data ?? []).map((f, i, arr) => (
            <View
              key={f.key}
              className={`flex-row items-center justify-between gap-3 p-4 ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View className="flex-1">
                <Text className="font-mono text-sm text-foreground">
                  {f.key}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {f.description}
                </Text>
              </View>
              <Switch
                checked={f.enabled}
                onCheckedChange={(v) => onToggle(f.key, v)}
              />
            </View>
          ))}
    </View>
  );
}

function BrandingSection() {
  const [siteName, setSiteName] = React.useState("EVO TV");
  const [tagline, setTagline] = React.useState(
    "African esports, live everywhere.",
  );
  const [primary, setPrimary] = React.useState("#2CD7E3");

  return (
    <View className="rounded-xl border border-border bg-card/40 p-4">
      <Text className="text-sm font-semibold text-foreground">Branding</Text>

      <Text className="mt-3 mb-1.5 text-xs text-muted-foreground">
        Site name
      </Text>
      <Input
        value={siteName}
        onChangeText={setSiteName}
        className="bg-card"
      />

      <Text className="mt-3 mb-1.5 text-xs text-muted-foreground">Tagline</Text>
      <Input value={tagline} onChangeText={setTagline} className="bg-card" />

      <Text className="mt-3 mb-1.5 text-xs text-muted-foreground">
        Primary color
      </Text>
      <View className="flex-row items-center gap-3">
        <View
          style={{
            backgroundColor: primary,
            width: 36,
            height: 36,
            borderRadius: 6,
          }}
        />
        <Input
          value={primary}
          onChangeText={setPrimary}
          className="flex-1 bg-card font-mono"
        />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {["#2CD7E3", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"].map((c) => (
          <Pressable
            key={c}
            onPress={() => setPrimary(c)}
            style={{
              backgroundColor: c,
              width: 32,
              height: 32,
              borderRadius: 6,
              borderWidth: primary === c ? 2 : 0,
              borderColor: "#FAFAFA",
            }}
          />
        ))}
      </View>

      <View className="mt-5 overflow-hidden rounded-lg border border-border">
        <View className="flex-row items-center gap-3 border-b border-border bg-background p-4">
          <View
            style={{
              backgroundColor: primary,
              width: 32,
              height: 32,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-sm font-black text-black">
              {siteName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground">
              {siteName}
            </Text>
            <Text style={{ color: primary }} className="text-xs">
              {tagline}
            </Text>
          </View>
        </View>
        <View className="bg-background p-4">
          <Text className="mb-2 text-xs text-muted-foreground">
            Action button preview:
          </Text>
          <View
            className="self-start rounded-md px-3 py-1.5"
            style={{ backgroundColor: primary }}
          >
            <Text className="text-xs font-semibold text-black">Subscribe</Text>
          </View>
        </View>
      </View>

      <Button
        className="mt-4 self-start bg-cyan-500"
        onPress={() => toast.success("Branding saved")}
      >
        <Save size={14} color="#000" />
        <Text className="text-sm font-medium text-black">Save branding</Text>
      </Button>
    </View>
  );
}

function EmailTemplatesSection() {
  const [templateKey, setTemplateKey] =
    React.useState<keyof typeof EMAIL_TEMPLATES>("welcome");
  const [body, setBody] = React.useState(EMAIL_TEMPLATES["welcome"]!.body);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setBody(EMAIL_TEMPLATES[templateKey]!.body);
  }, [templateKey]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const tpl = EMAIL_TEMPLATES[templateKey]!;
      const { savedAt } = await saveEmailTemplate(
        String(templateKey),
        tpl.label,
        body,
      );
      const niceTime = new Date(savedAt).toLocaleTimeString();
      toast.success(`"${tpl.label}" saved at ${niceTime}`);
    } catch {
      toast.error("Could not save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="rounded-xl border border-border bg-card/40 p-4">
      <Text className="text-sm font-semibold text-foreground">
        Email templates
      </Text>

      <Text className="mt-3 mb-1.5 text-xs text-muted-foreground">
        Template
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          {Object.entries(EMAIL_TEMPLATES).map(([k, v]) => (
            <Pressable
              key={k}
              onPress={() => setTemplateKey(k as keyof typeof EMAIL_TEMPLATES)}
              className={`rounded-md border px-3 py-1.5 ${
                templateKey === k
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-xs ${
                  templateKey === k
                    ? "text-cyan-300"
                    : "text-muted-foreground"
                }`}
              >
                {v.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text className="mt-4 mb-1.5 text-xs text-muted-foreground">
        Body (markdown)
      </Text>
      <Input
        value={body}
        onChangeText={setBody}
        multiline
        className="h-64 bg-background font-mono text-xs"
        textAlignVertical="top"
      />
      <Text className="mt-2 text-xs text-muted-foreground">
        Use {"{{variables}}"} to substitute at send-time.
      </Text>

      <Button
        className="mt-4 self-start bg-cyan-500"
        onPress={handleSave}
        disabled={saving}
      >
        <Save size={14} color="#000" />
        <Text className="text-sm font-medium text-black">
          {saving ? "Saving…" : "Save template"}
        </Text>
      </Button>
    </View>
  );
}
