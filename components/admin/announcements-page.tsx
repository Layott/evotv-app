import * as React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import { Bell, Send, X } from "@/components/icons";
import {
  previewAnnouncement,
  sendAnnouncement,
  type AnnouncementAudience,
  type AnnouncementPreview,
} from "@/lib/api/announcements";
import { roleLabel } from "@/lib/auth/roles";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useTokens } from "@/lib/theme/tokens";

import { PageHeader } from "./page-header";

/**
 * Telling viewers something.
 *
 * Three channels fire at once: the notification row in the app and on the site,
 * an Expo push to anyone who installed the app, and a Web Push to anyone who
 * allowed browser notifications. The row is the one that cannot fail silently,
 * so it is always written even when nobody has a device registered, which is
 * why the delivered counts come back lower than the recipient count.
 *
 * The audience check is not a formality. There is no unsend once a push is with
 * Apple or Google, so the number of people this reaches is answered before the
 * send rather than after it.
 */

type AudienceKind = "everyone" | "role" | "user";

/**
 * The roles somebody can actually hold. `guest` is in the ladder but is never
 * stored on an account, so offering it would be an audience of nobody.
 */
const AUDIENCE_ROLES: Role[] = [
  "user",
  "premium",
  "creator",
  "support_admin",
  "moderator",
  "finance_admin",
  "admin",
  "head_admin",
];

const BODY_LIMIT = 500;

export function AnnouncementsPage() {
  const t = useTokens();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [audienceKind, setAudienceKind] =
    React.useState<AudienceKind>("everyone");
  const [audienceRole, setAudienceRole] = React.useState<Role>("user");
  const [audienceEmail, setAudienceEmail] = React.useState("");
  const [confirming, setConfirming] =
    React.useState<AnnouncementPreview | null>(null);

  const audience: AnnouncementAudience =
    audienceKind === "role"
      ? { kind: "role", role: audienceRole }
      : audienceKind === "user"
        ? { kind: "user", email: audienceEmail.trim() }
        : { kind: "everyone" };

  const payload = {
    title: title.trim(),
    body: body.trim(),
    linkUrl: linkUrl.trim(),
    audience,
  };

  const ready =
    payload.title.length >= 3 &&
    payload.body.length >= 3 &&
    (audienceKind !== "user" || audienceEmail.trim().length > 3);

  const preview = useMutation({
    mutationFn: () => previewAnnouncement(payload),
    onSuccess: setConfirming,
    onError: (err) =>
      toast.error("Could not work out the audience", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  const send = useMutation({
    mutationFn: () => sendAnnouncement(payload),
    onSuccess: (result) => {
      toast.success(
        `Sent to ${result.recipients} account${result.recipients === 1 ? "" : "s"}`,
        {
          description: `${result.expoDelivered} app push${
            result.expoDelivered === 1 ? "" : "es"
          }, ${result.webDelivered} browser.`,
        },
      );
      setConfirming(null);
      setTitle("");
      setBody("");
      setLinkUrl("");
    },
    onError: (err) =>
      toast.error("Could not send it", {
        description: err instanceof Error ? err.message : "Unknown error",
      }),
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          title="Announcements"
          description="One message, three ways: the notification list, the app, and the browser. There is no unsend."
        />

        <View className="rounded-2xl bg-card p-4">
          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="We are live with MPRO LEAGUE"
              className="bg-background"
            />
          </Field>

          <Field label="Message">
            <Input
              value={body}
              onChangeText={setBody}
              maxLength={BODY_LIMIT}
              multiline
              placeholder="Kick-off in ten minutes. Tap to watch."
              className="min-h-[88px] bg-background"
            />
            <Text className="mt-1 text-xs text-muted-foreground">
              {body.length} of {BODY_LIMIT}
            </Text>
          </Field>

          <Field label="Where tapping it goes">
            <Input
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              placeholder="/channel"
              className="bg-background"
            />
            <Text className="mt-1 text-xs text-muted-foreground">
              An in-app path starting with a slash. Leave it blank to open the
              app.
            </Text>
          </Field>

          <Field label="Who gets it">
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  ["everyone", "Everyone"],
                  ["role", "A role"],
                  ["user", "One person"],
                ] as [AudienceKind, string][]
              ).map(([kind, label]) => {
                const on = audienceKind === kind;
                return (
                  <Pressable
                    key={kind}
                    onPress={() => setAudienceKind(kind)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    className={`rounded-lg px-3 py-2 active:opacity-70 ${
                      on ? "bg-brand/25" : "bg-background"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        on ? "text-brand" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          {audienceKind === "role" ? (
            <Field label="Role">
              <Select
                value={audienceRole}
                onValueChange={(v) => setAudienceRole(v as Role)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pick a role" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {audienceKind === "user" ? (
            <Field label="Email">
              <Input
                value={audienceEmail}
                onChangeText={setAudienceEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@evotv.co"
                className="bg-background"
              />
            </Field>
          ) : null}

          <Button
            disabled={!ready || preview.isPending}
            className="mt-2 bg-brand"
            onPress={() => preview.mutate()}
          >
            {preview.isPending ? (
              <Spinner size="small" />
            ) : (
              <Send size={14} color={t.bg} />
            )}
            <Text className="text-sm font-semibold text-background">
              {preview.isPending ? "Counting…" : "Check the audience"}
            </Text>
          </Button>
        </View>

        <View className="mt-4 rounded-2xl bg-card p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <Bell size={14} color={t.brand} />
            <Text className="text-sm font-semibold text-foreground">
              How it will look
            </Text>
          </View>
          <View className="rounded-xl bg-background p-3">
            <Text className="text-sm font-medium text-foreground">
              {title.trim() || "Title"}
            </Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              {body.trim() || "The message body appears here."}
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-2xl bg-card p-4">
          <Text className="mb-2 text-sm font-semibold text-foreground">
            Worth knowing
          </Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            A push only reaches somebody who installed the app or allowed
            browser notifications. Everyone else still gets the message in their
            notifications list, which is why the counts differ.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={confirming !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirming(null)}
      >
        <Pressable
          onPress={() => setConfirming(null)}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-2xl bg-background p-5 pb-8"
          >
            <View className="mb-3 flex-row items-start justify-between">
              <Text className="text-lg font-bold text-foreground">
                Send this?
              </Text>
              <Pressable
                onPress={() => setConfirming(null)}
                hitSlop={12}
                accessibilityLabel="Close"
              >
                <X size={20} color={t.muted} />
              </Pressable>
            </View>

            {confirming ? (
              <Text className="text-sm leading-5 text-muted-foreground">
                This reaches {confirming.recipients} account
                {confirming.recipients === 1 ? "" : "s"} ({confirming.description}
                ). {confirming.withPushTokens} of them can receive a push right
                now. There is no unsend.
              </Text>
            ) : null}

            <View className="mt-5 flex-row gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={() => setConfirming(null)}
              >
                <Text className="text-sm font-medium text-foreground">
                  Not yet
                </Text>
              </Button>
              <Button
                disabled={send.isPending}
                className="flex-1 bg-brand"
                onPress={() => send.mutate()}
              >
                <Text className="text-sm font-semibold text-background">
                  {send.isPending ? "Sending…" : "Send it"}
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Label className="mb-1.5 text-xs text-muted-foreground">{label}</Label>
      {children}
    </View>
  );
}
