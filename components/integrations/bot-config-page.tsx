import * as React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Trash2,
  Zap,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { useMockAuth } from "@/components/providers";
import {
  connectBot,
  disconnectBot,
  getBotForKind,
  maskToken,
  triggerTestEvent,
  updateBotMappings,
  validateBotToken,
  validateServerId,
  type BotIntegration,
  type BotKind,
  type ChannelMappings,
} from "@/lib/mock/bots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { FieldWrapper } from "@/components/auth/form-field";
import { BotIcon } from "@/components/integrations/bot-icon";

export interface BotBrand {
  label: string;
  containerClass: string;
  iconLabel: string;
  iconColor: string;
  helpToken: string;
  helpServerLabel: string;
  helpServerHint: string;
  serverLabelTitle: string;
  placeholderToken: string;
  placeholderServer: string;
}

interface Props {
  kind: BotKind;
  brand: BotBrand;
}

const DEFAULT_MAPPINGS: ChannelMappings = {
  goLive: "",
  matchResults: "",
  drops: "",
};

export function BotConfigPage({ kind, brand }: Props) {
  const router = useRouter();
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const qc = useQueryClient();

  const botQ = useQuery({
    queryKey: ["bot", userId, kind],
    queryFn: () => getBotForKind(userId, kind),
  });

  if (botQ.isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: brand.label }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: brand.label }} />
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
          <Pressable
            onPress={() => router.push("/(authed)/integrations")}
            className="flex-row items-center gap-1 self-start"
            accessibilityRole="link"
          >
            <ArrowLeft size={14} color="#A3A3A3" />
            <Text className="text-xs text-muted-foreground">All integrations</Text>
          </Pressable>

          <View className="mt-4 flex-row items-start gap-4">
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl ${brand.containerClass}`}
            >
              <BotIcon
                label={brand.iconLabel}
                color={brand.iconColor}
                size={28}
              />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {brand.label} integration
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Pipe EVO TV events into your {brand.label}{" "}
                {kind === "discord" ? "server" : "group"}.
              </Text>
            </View>
          </View>

          {botQ.data ? (
            <ConnectedView
              bot={botQ.data}
              brand={brand}
              onDisconnect={async () => {
                await disconnectBot(botQ.data!.id);
                qc.invalidateQueries({ queryKey: ["bot", userId, kind] });
                qc.invalidateQueries({ queryKey: ["bots", userId] });
                toast.success(`${brand.label} disconnected`);
              }}
              onSaveMappings={async (m) => {
                await updateBotMappings(botQ.data!.id, m);
                qc.invalidateQueries({ queryKey: ["bot", userId, kind] });
                toast.success("Channel mappings updated");
              }}
              onTest={async () => {
                await triggerTestEvent(botQ.data!.id);
                qc.invalidateQueries({ queryKey: ["bot", userId, kind] });
                toast.success(`Test alert sent to ${brand.label}`);
              }}
            />
          ) : (
            <ConnectForm
              kind={kind}
              brand={brand}
              userId={userId}
              onConnected={() => {
                qc.invalidateQueries({ queryKey: ["bot", userId, kind] });
                qc.invalidateQueries({ queryKey: ["bots", userId] });
              }}
            />
          )}

          <View className="mt-8 rounded-2xl border border-border bg-card/40 p-5">
            <Text className="text-sm font-semibold text-foreground">
              How it works
            </Text>
            <View className="mt-2 gap-1.5">
              <Text className="text-sm text-muted-foreground">1. {brand.helpToken}</Text>
              <Text className="text-sm text-muted-foreground">
                2. Pick the channel(s) where each event type should land.
              </Text>
              <Text className="text-sm text-muted-foreground">
                3. Send a test event to confirm everything's wired up.
              </Text>
              <Text className="text-sm text-muted-foreground">
                4. EVO TV will push live alerts, match results, and drops automatically.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function ConnectForm({
  kind,
  brand,
  userId,
  onConnected,
}: {
  kind: BotKind;
  brand: BotBrand;
  userId: string;
  onConnected: () => void;
}) {
  const [token, setToken] = React.useState("");
  const [serverId, setServerId] = React.useState("");
  const [serverName, setServerName] = React.useState("");
  const [mappings, setMappings] = React.useState<ChannelMappings>(DEFAULT_MAPPINGS);
  const [submitting, setSubmitting] = React.useState(false);
  const [touched, setTouched] = React.useState<{ token?: boolean; serverId?: boolean }>(
    {},
  );

  const tokenInvalid = touched.token && token.length > 0 && !validateBotToken(kind, token);
  const serverInvalid =
    touched.serverId && serverId.length > 0 && !validateServerId(kind, serverId);

  async function onSubmit() {
    if (submitting) return;
    setTouched({ token: true, serverId: true });
    if (!validateBotToken(kind, token)) {
      toast.error("That token doesn't look right");
      return;
    }
    if (!validateServerId(kind, serverId)) {
      toast.error(brand.helpServerHint);
      return;
    }
    setSubmitting(true);
    try {
      await connectBot(userId, kind, {
        token,
        serverId,
        serverName: serverName || undefined,
        channelMappings: mappings,
      });
      toast.success(`${brand.label} connected`, {
        description: "EVO TV will now post events to your server.",
      });
      onConnected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="mt-6 gap-5 rounded-2xl border border-border bg-card/50 p-5">
      <FieldWrapper
        id="bot-token"
        label="Bot token"
        error={tokenInvalid ? "Token format looks invalid." : undefined}
        hint={!tokenInvalid ? brand.helpToken : undefined}
      >
        <Input
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={token}
          onChangeText={setToken}
          onBlur={() => setTouched((t) => ({ ...t, token: true }))}
          placeholder={brand.placeholderToken}
          className={`h-11 font-mono ${tokenInvalid ? "border-destructive" : "border-border"}`}
        />
      </FieldWrapper>

      <FieldWrapper
        id="bot-server-id"
        label={brand.helpServerLabel}
        error={serverInvalid ? brand.helpServerHint : undefined}
      >
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="default"
          value={serverId}
          onChangeText={setServerId}
          onBlur={() => setTouched((t) => ({ ...t, serverId: true }))}
          placeholder={brand.placeholderServer}
          className={`h-11 font-mono ${serverInvalid ? "border-destructive" : "border-border"}`}
        />
      </FieldWrapper>

      <FieldWrapper id="bot-server-name" label={brand.serverLabelTitle}>
        <Input
          value={serverName}
          onChangeText={setServerName}
          placeholder="Optional"
          className="h-11 border-border"
        />
      </FieldWrapper>

      <ChannelMappingFields mappings={mappings} onChange={setMappings} kind={kind} />

      <Button
        onPress={onSubmit}
        disabled={submitting}
        className="h-11 bg-sky-500"
        textClassName="text-neutral-950 font-semibold"
      >
        {submitting ? (
          <>
            <Spinner color="#0A0A0A" />
            <Text className="text-sm font-semibold text-neutral-950">
              Connecting...
            </Text>
          </>
        ) : (
          <Text className="text-sm font-semibold text-neutral-950">
            Connect {brand.label}
          </Text>
        )}
      </Button>
    </View>
  );
}

function ConnectedView({
  bot,
  brand,
  onDisconnect,
  onSaveMappings,
  onTest,
}: {
  bot: BotIntegration;
  brand: BotBrand;
  onDisconnect: () => Promise<void>;
  onSaveMappings: (m: ChannelMappings) => Promise<void>;
  onTest: () => Promise<void>;
}) {
  const [mappings, setMappings] = React.useState<ChannelMappings>(bot.channelMappings);
  const [savingMappings, setSavingMappings] = React.useState(false);
  const [disconnecting, setDisconnecting] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  const dirty =
    mappings.goLive !== bot.channelMappings.goLive ||
    mappings.matchResults !== bot.channelMappings.matchResults ||
    mappings.drops !== bot.channelMappings.drops;

  async function save() {
    if (savingMappings || !dirty) return;
    setSavingMappings(true);
    try {
      await onSaveMappings(mappings);
    } finally {
      setSavingMappings(false);
    }
  }

  function disconnect() {
    if (disconnecting) return;
    Alert.alert(
      `Disconnect ${brand.label}?`,
      "EVO TV will stop posting events.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setDisconnecting(true);
            try {
              await onDisconnect();
            } finally {
              setDisconnecting(false);
            }
          },
        },
      ],
    );
  }

  async function fireTest() {
    if (testing) return;
    setTesting(true);
    try {
      await onTest();
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <View className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <View className="flex-row items-center gap-2">
          <CheckCircle2 size={18} color="#6EE7B7" />
          <Text className="text-sm font-semibold text-emerald-200">
            Connected to {bot.serverName}
          </Text>
        </View>
        <View className="mt-3 flex-row flex-wrap gap-3">
          <DetailCell label="Token" value={maskToken(bot.token)} mono />
          <DetailCell label="Server ID" value={bot.serverId} mono />
          <DetailCell label="Events sent" value={String(bot.eventCount)} />
        </View>
      </View>

      <View className="mt-6 gap-4 rounded-2xl border border-border bg-card/50 p-5">
        <Text className="text-sm font-semibold uppercase tracking-widest text-foreground">
          Channel routing
        </Text>
        <ChannelMappingFields
          mappings={mappings}
          onChange={setMappings}
          kind={bot.kind}
        />
        <View className="flex-row flex-wrap items-center gap-2">
          <Button
            onPress={save}
            disabled={!dirty || savingMappings}
            className="bg-sky-500"
            textClassName="text-neutral-950 font-semibold"
          >
            {savingMappings ? (
              <>
                <Spinner color="#0A0A0A" />
                <Text className="text-sm font-semibold text-neutral-950">
                  Saving...
                </Text>
              </>
            ) : (
              <Text className="text-sm font-semibold text-neutral-950">
                Save mappings
              </Text>
            )}
          </Button>
          <Button variant="outline" onPress={fireTest} disabled={testing}>
            {testing ? <Spinner color="#FAFAFA" /> : <Zap size={14} color="#FAFAFA" />}
            <Text className="text-sm font-medium text-foreground">
              Send test alert
            </Text>
          </Button>
        </View>
      </View>

      <View className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-rose-200">Disconnect</Text>
            <Text className="text-xs text-rose-300/80">
              Removes the integration. You can reconnect any time.
            </Text>
          </View>
          <Button
            variant="outline"
            onPress={disconnect}
            disabled={disconnecting}
            className="border-rose-500/30"
          >
            {disconnecting ? (
              <Spinner color="#FCA5A5" />
            ) : (
              <Trash2 size={14} color="#FCA5A5" />
            )}
            <Text className="text-sm font-medium text-rose-200">Disconnect</Text>
          </Button>
        </View>
      </View>
    </>
  );
}

function ChannelMappingFields({
  mappings,
  onChange,
  kind,
}: {
  mappings: ChannelMappings;
  onChange: (m: ChannelMappings) => void;
  kind: BotKind;
}) {
  const placeholder = kind === "discord" ? "#go-live" : "@evo-go-live";
  const fields: Array<{
    key: keyof ChannelMappings;
    label: string;
    description: string;
  }> = [
    {
      key: "goLive",
      label: "Go-live alerts",
      description: "Posts when a stream you follow starts.",
    },
    {
      key: "matchResults",
      label: "Match results",
      description: "Final scores and bracket updates after each match.",
    },
    {
      key: "drops",
      label: "Drop announcements",
      description: "Limited merch and digital drops shown in chat.",
    },
  ];

  return (
    <View className="gap-3">
      {fields.map((f) => (
        <View key={f.key} className="gap-1.5">
          <View>
            <Label className="text-sm text-foreground">{f.label}</Label>
            <Text className="text-[11px] text-muted-foreground">{f.description}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Send size={14} color="#A3A3A3" />
            <Input
              value={mappings[f.key]}
              onChangeText={(v) => onChange({ ...mappings, [f.key]: v })}
              placeholder={placeholder}
              autoCapitalize="none"
              className="h-10 flex-1 font-mono border-border"
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View className="min-w-[28%] flex-1">
      <Text className="text-[10px] uppercase tracking-widest text-emerald-300/70">
        {label}
      </Text>
      <Text
        className={`mt-0.5 text-xs text-emerald-100 ${mono ? "font-mono" : ""}`}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
