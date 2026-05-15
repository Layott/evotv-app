import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Palette,
  Trash2,
  UserCog,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { useMockAuth, useTheme } from "@/components/providers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { SectionCard, SettingRow } from "@/components/settings/section-card";
import { getUserPrefs, requestDataExport } from "@/lib/mock";
import { deleteOwnAccount } from "@/lib/api/profile";
import type { UserPrefs } from "@/lib/types";

const LANGS = [
  { v: "en", label: "English" },
  { v: "fr", label: "Français" },
  { v: "pt", label: "Português" },
  { v: "ha", label: "Hausa" },
  { v: "yo", label: "Yoruba" },
  { v: "ig", label: "Igbo" },
  { v: "sw", label: "Kiswahili" },
];

const QUALITIES = [
  { v: "auto", label: "Auto" },
  { v: "1080p", label: "1080p" },
  { v: "720p", label: "720p" },
  { v: "480p", label: "480p" },
  { v: "360p", label: "360p" },
];

const VISIBILITIES = [
  { v: "public", label: "Public" },
  { v: "followers", label: "Followers only" },
  { v: "private", label: "Private" },
];

const THEMES = [
  { v: "system", label: "Match system", icon: Palette },
  { v: "dark", label: "Dark", icon: Eye },
  { v: "light", label: "Light", icon: Eye },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, accountEmail, signOut } = useMockAuth();
  const { theme, setTheme } = useTheme();

  const [prefs, setPrefs] = React.useState<UserPrefs | null>(null);
  const [loading, setLoading] = React.useState(true);

  // local state mirrors the saved prefs but updates eagerly so toggles feel instant
  const [notifGoLive, setNotifGoLive] = React.useState(true);
  const [notifEvent, setNotifEvent] = React.useState(true);
  const [notifNewVod, setNotifNewVod] = React.useState(true);
  const [notifDigest, setNotifDigest] = React.useState(false);

  const [quality, setQuality] = React.useState("auto");
  const [captions, setCaptions] = React.useState(false);
  const [autoplay, setAutoplay] = React.useState(true);

  const [visibility, setVisibility] = React.useState<
    "public" | "followers" | "private"
  >("public");
  const [historyVisible, setHistoryVisible] = React.useState(true);

  const [language, setLanguage] = React.useState("en");

  const [savingPwd, setSavingPwd] = React.useState(false);
  const [pwd, setPwd] = React.useState({ current: "", next: "", confirm: "" });
  const [pwdError, setPwdError] = React.useState<string | null>(null);

  const [deleting, setDeleting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const p = await getUserPrefs(user.id);
      if (cancelled) return;
      setPrefs(p);
      if (p) {
        setNotifGoLive(p.notifOptIn.goLive);
        setNotifEvent(p.notifOptIn.eventReminder);
        setNotifNewVod(p.notifOptIn.newVod);
        setNotifDigest(p.notifOptIn.weeklyDigest);
        setQuality(p.playback.defaultQuality);
        setCaptions(p.playback.captions);
        setAutoplay(p.playback.autoplay);
        setLanguage(p.language);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const email =
    accountEmail ?? (user ? `${user.handle}@evo.tv` : "guest@evo.tv");

  const handleChangePwd = React.useCallback(async () => {
    setPwdError(null);
    if (pwd.current.length < 8) {
      setPwdError("Enter your current password");
      return;
    }
    if (pwd.next.length < 8) {
      setPwdError("New password must be at least 8 characters");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdError("Passwords don't match");
      return;
    }
    setSavingPwd(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingPwd(false);
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Password changed");
  }, [pwd]);

  const handleDeleteAccount = React.useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { scheduledForIso } = await deleteOwnAccount();
      const niceDate = new Date(scheduledForIso).toLocaleDateString();
      toast.error(`Account queued for deletion. Final purge: ${niceDate}.`);
      // Backend has revoked sessions. Sign out + bounce to login.
      await signOut();
      router.replace("/(auth)/login");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not queue deletion. Try again later.",
      );
    } finally {
      setDeleting(false);
    }
  }, [deleting, signOut, router]);

  const handleExport = React.useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { ticketId } = await requestDataExport(user?.id ?? "user_current");
      toast.success(`Export queued. Ticket: ${ticketId}.`);
    } catch {
      toast.error("Could not queue export. Try again later.");
    } finally {
      setExporting(false);
    }
  }, [exporting, user]);

  const handleSignOut = React.useCallback(() => {
    signOut();
    router.replace("/(auth)/login");
  }, [signOut, router]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Settings" }} />
        <View className="flex-1 items-center justify-center bg-background">
          <Spinner size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-5 pb-3">
          <Text className="text-2xl font-bold text-foreground">Settings</Text>
          <Text className="text-sm text-muted-foreground">
            Manage your EVO TV experience.
          </Text>
        </View>

        <View className="gap-4 px-4">
          <Pressable
            onPress={() => router.push("/(authed)/settings/billing")}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
            accessibilityRole="button"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(44,215,227,0.12)" }}
            >
              <CreditCard size={18} color="#2CD7E3" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Billing & subscription
              </Text>
              <Text className="text-xs text-muted-foreground">
                Plan, payment method, receipts
              </Text>
            </View>
            <ChevronRight size={18} color="#737373" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(authed)/settings/api-keys" as never)}
            className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
            accessibilityRole="button"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(168,85,247,0.12)" }}
            >
              <KeyRound size={18} color="#A855F7" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                API keys
              </Text>
              <Text className="text-xs text-muted-foreground">
                Generate keys for scripts + integrations
              </Text>
            </View>
            <ChevronRight size={18} color="#737373" />
          </Pressable>

          {/* Account */}
          <SectionCard
            title="Account"
            description="Sign-in email, password, and account removal."
          >
            <View className="gap-4">
              <View className="gap-1.5">
                <Label>Email</Label>
                <Input
                  editable={false}
                  value={email}
                  className="bg-background/60"
                />
                <Text className="text-xs text-muted-foreground">
                  Contact support to change your email.
                </Text>
              </View>

              <View className="gap-3">
                <View className="gap-1.5">
                  <Label>Current password</Label>
                  <Input
                    secureTextEntry
                    value={pwd.current}
                    onChangeText={(v) =>
                      setPwd((s) => ({ ...s, current: v }))
                    }
                  />
                </View>
                <View className="gap-1.5">
                  <Label>New password</Label>
                  <Input
                    secureTextEntry
                    value={pwd.next}
                    onChangeText={(v) => setPwd((s) => ({ ...s, next: v }))}
                  />
                </View>
                <View className="gap-1.5">
                  <Label>Confirm password</Label>
                  <Input
                    secureTextEntry
                    value={pwd.confirm}
                    onChangeText={(v) =>
                      setPwd((s) => ({ ...s, confirm: v }))
                    }
                  />
                </View>
                {pwdError ? (
                  <Text className="text-xs" style={{ color: "#f87171" }}>
                    {pwdError}
                  </Text>
                ) : null}
                <Button
                  onPress={handleChangePwd}
                  disabled={savingPwd}
                  className="h-10 self-start bg-brand"
                  textClassName="text-black"
                >
                  {savingPwd ? "Saving..." : "Change password"}
                </Button>
              </View>

              <View
                className="rounded-xl border p-4"
                style={{
                  borderColor: "rgba(239,68,68,0.3)",
                  backgroundColor: "rgba(239,68,68,0.05)",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: "#f87171" }}
                >
                  Danger zone
                </Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Marks your account for deletion. Sessions sign out instantly;
                  your data is purged after a 30-day grace window.
                </Text>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3 self-start"
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                      <Text className="text-sm font-medium text-white">
                        Delete account
                      </Text>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sessions revoke immediately. Watch history, chats,
                        clips and personal data are permanently purged after 30
                        days. The account row is anonymized so referenced
                        comments and tips stay intact.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive"
                        onPress={handleDeleteAccount}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </View>
            </View>
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            title="Notifications"
            description="Choose what lands in your EVO TV inbox."
          >
            <View>
              <SettingRow
                label="Stream goes live"
                description="Teams & streamers you follow"
              >
                <Switch
                  checked={notifGoLive}
                  onCheckedChange={(v) => {
                    setNotifGoLive(v);
                    toast.success(`Go-live alerts ${v ? "on" : "off"}`);
                  }}
                />
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="Event reminders"
                description="Tournaments on your watchlist"
              >
                <Switch
                  checked={notifEvent}
                  onCheckedChange={(v) => {
                    setNotifEvent(v);
                    toast.success(`Event reminders ${v ? "on" : "off"}`);
                  }}
                />
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="New VOD"
                description="When fresh content is posted"
              >
                <Switch
                  checked={notifNewVod}
                  onCheckedChange={(v) => {
                    setNotifNewVod(v);
                    toast.success(`New-VOD alerts ${v ? "on" : "off"}`);
                  }}
                />
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="Weekly digest"
                description="Email every Monday"
              >
                <Switch
                  checked={notifDigest}
                  onCheckedChange={(v) => {
                    setNotifDigest(v);
                    toast.success(`Weekly digest ${v ? "on" : "off"}`);
                  }}
                />
              </SettingRow>
            </View>
            <Pressable
              onPress={() => router.push("/(authed)/notifications")}
              className="mt-3 flex-row items-center gap-1 self-start active:opacity-70"
            >
              <Bell size={14} color="#2CD7E3" />
              <Text className="text-sm font-medium" style={{ color: "#2CD7E3" }}>
                Open notification inbox
              </Text>
            </Pressable>
          </SectionCard>

          {/* Playback */}
          <SectionCard
            title="Playback"
            description="Default player behaviour."
          >
            <View>
              <SettingRow
                label="Default quality"
                description="Attempted first on every stream"
              >
                <View style={{ width: 130 }}>
                  <Select
                    value={quality}
                    onValueChange={(v) => {
                      setQuality(v);
                      toast.success(`Default quality ${v}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITIES.map((q) => (
                        <SelectItem key={q.v} value={q.v}>
                          {q.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </View>
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="Captions by default"
                description="Turn on subtitles when available"
              >
                <Switch
                  checked={captions}
                  onCheckedChange={(v) => {
                    setCaptions(v);
                    toast.success(`Captions ${v ? "enabled" : "disabled"}`);
                  }}
                />
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="Autoplay next"
                description="Queue related VODs"
              >
                <Switch
                  checked={autoplay}
                  onCheckedChange={(v) => {
                    setAutoplay(v);
                    toast.success(`Autoplay ${v ? "on" : "off"}`);
                  }}
                />
              </SettingRow>
            </View>
          </SectionCard>

          {/* Privacy */}
          <SectionCard
            title="Privacy"
            description="Control what others can see about you."
          >
            <View>
              <SettingRow
                label="Profile visibility"
                description="Who can view your profile page"
              >
                <View style={{ width: 160 }}>
                  <Select
                    value={visibility}
                    onValueChange={(v) => {
                      setVisibility(v as "public" | "followers" | "private");
                      toast.success(`Visibility: ${v}`);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIBILITIES.map((v) => (
                        <SelectItem key={v.v} value={v.v}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </View>
              </SettingRow>
              <View className="h-px bg-border" />
              <SettingRow
                label="Show watch history"
                description="Let others see what you've been watching"
              >
                <Switch
                  checked={historyVisible}
                  onCheckedChange={(v) => {
                    setHistoryVisible(v);
                    toast.success(v ? "History visible" : "History hidden");
                  }}
                />
              </SettingRow>
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between gap-3 py-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Export my data
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Download a copy of your EVO TV data
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleExport}
                  disabled={exporting}
                >
                  <Download size={14} color="#FAFAFA" />
                  <Text className="text-sm font-medium text-foreground">
                    {exporting ? "Queueing..." : "Request"}
                  </Text>
                </Button>
              </View>
            </View>
          </SectionCard>

          {/* Language */}
          <SectionCard title="Language" description="Display language across EVO TV.">
            <View className="gap-2" style={{ maxWidth: 280 }}>
              <Label>App language</Label>
              <Select
                value={language}
                onValueChange={(v) => {
                  setLanguage(v);
                  const found = LANGS.find((l) => l.v === v);
                  toast.success(`Language set to ${found?.label ?? v}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => (
                    <SelectItem key={l.v} value={l.v}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
          </SectionCard>

          {/* Appearance — dark mode only for v1. Light theme support is on
              the roadmap (most UI tokens hardcode dark right now). */}
          <SectionCard
            title="Appearance"
            description="Dark theme only for v1. Light mode coming."
          >
            <View className="flex-row items-center gap-3 rounded-xl border border-border bg-background p-4">
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "#1f1f1f" }}
              >
                <Text style={{ color: "#2CD7E3", fontWeight: "700" }}>🌙</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  Dark
                </Text>
                <Text className="text-[11px] text-muted-foreground">
                  Locked for v1 — light theme audit is queued.
                </Text>
              </View>
            </View>
            {/* Suppress unused-warning */}
            {(() => {
              void THEMES;
              void theme;
              void setTheme;
              return null;
            })()}
          </SectionCard>

          {/* Quick links */}
          <SectionCard title="More" description="Other settings & actions.">
            <View className="gap-2">
              <Pressable
                onPress={() =>
                  router.push("/(authed)/checkout/mobile-money")
                }
                className="flex-row items-center gap-3 rounded-xl border border-border bg-background p-3 active:opacity-80"
              >
                <Lock size={16} color="#A3A3A3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Mobile money checkout
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    M-Pesa, MTN MoMo, Airtel
                  </Text>
                </View>
                <ChevronRight size={16} color="#737373" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(authed)/cart")}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-background p-3 active:opacity-80"
              >
                <Globe size={16} color="#A3A3A3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Cart & shop
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Review your cart
                  </Text>
                </View>
                <ChevronRight size={16} color="#737373" />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(authed)/profile/orders")}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-background p-3 active:opacity-80"
              >
                <UserCog size={16} color="#A3A3A3" />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Orders
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    View shipping & receipts
                  </Text>
                </View>
                <ChevronRight size={16} color="#737373" />
              </Pressable>
            </View>
          </SectionCard>

          {/* Sign out */}
          <View className="mt-2">
            <Button
              variant="outline"
              onPress={handleSignOut}
              className="h-11 w-full border-destructive/40"
            >
              <LogOut size={16} color="#EF4444" />
              <Text className="text-sm font-medium text-destructive">
                Sign out
              </Text>
            </Button>
          </View>

          {/* Static badges row */}
          {prefs ? (
            <View className="flex-row flex-wrap gap-2">
              <Badge variant="outline" className="border-border">
                <Text className="text-xs text-muted-foreground">
                  Saved theme: {prefs.theme}
                </Text>
              </Badge>
              <Badge variant="outline" className="border-border">
                <Text className="text-xs text-muted-foreground">
                  Saved lang: {prefs.language}
                </Text>
              </Badge>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

