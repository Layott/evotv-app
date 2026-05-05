import * as React from "react";
import { Text, View } from "react-native";
import {
  BarChart3,
  Coins,
  Mic2,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react-native";

interface Feature {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Coins,
    iconColor: "#2CD7E3",
    title: "70/30 revenue split",
    body: "Keep 70% of all tips and subs you earn on EVO TV. We handle hosting, CDN, and chat moderation.",
  },
  {
    icon: BarChart3,
    iconColor: "#2CD7E3",
    title: "Creator dashboard",
    body: "Real-time tips, follower growth, peak concurrent viewers, audience demographics, and payouts.",
  },
  {
    icon: Sparkles,
    iconColor: "#2CD7E3",
    title: "Auto-clipper",
    body: "Our highlight engine automatically queues your best moments — approve and publish in two taps.",
  },
  {
    icon: Mic2,
    iconColor: "#2CD7E3",
    title: "Featured slots",
    body: "Eligible streams get rotated through the EVO TV homepage and pre-roll slots for free.",
  },
  {
    icon: Users,
    iconColor: "#2CD7E3",
    title: "Audience tools",
    body: "Verified badges, subscriber-only chat, custom emote slots, and polls baked into every stream.",
  },
  {
    icon: Trophy,
    iconColor: "#2CD7E3",
    title: "Africa-first programs",
    body: "Dedicated regional managers, partner integrations (Glo, DStv), and quarterly creator summits.",
  },
];

export function ProgramPitch() {
  return (
    <View className="gap-3">
      {FEATURES.map((f) => (
        <View
          key={f.title}
          className="rounded-xl border border-border bg-card/40 p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-lg border border-brand/30 bg-brand/15">
            <f.icon size={18} color={f.iconColor} />
          </View>
          <Text className="mt-3 text-sm font-semibold text-foreground">
            {f.title}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">{f.body}</Text>
        </View>
      ))}
    </View>
  );
}
