import * as React from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Globe, Smartphone, Users, type LucideIcon } from "lucide-react-native";

import { useMockAuth } from "@/components/providers";
import { getAudienceBreakdown } from "@/lib/mock/creators";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardShell } from "@/components/creators/dashboard-shell";

const PIE_COLORS = ["#0EA5E9", "#A855F7", "#F59E0B", "#10B981", "#F43F5E", "#737373"];

export default function CreatorAudienceScreen() {
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";

  const audienceQ = useQuery({
    queryKey: ["creator-audience", userId],
    queryFn: () => getAudienceBreakdown(userId),
  });

  const stat = audienceQ.data;

  return (
    <DashboardShell
      title="Audience"
      screenTitle="Audience"
      description="Where your viewers are tuning in from, who they are, and when they show up."
    >
      {audienceQ.isLoading || !stat ? (
        <View className="gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </View>
      ) : (
        <View className="gap-6">
          <SectionCard
            title="Top countries"
            icon={Globe}
            iconColor="#7DD3FC"
            subtitle={`${stat.countries
              .reduce((s, c) => s + c.viewers, 0)
              .toLocaleString()} unique viewers`}
          >
            <View className="gap-3">
              {(() => {
                const max = Math.max(1, ...stat.countries.map((c) => c.viewers));
                return stat.countries.map((c) => (
                  <View key={c.code} className="gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-foreground">{c.label}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {c.viewers.toLocaleString()}
                      </Text>
                    </View>
                    <View className="h-2 overflow-hidden rounded-full bg-secondary">
                      <View
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${(c.viewers / max) * 100}%` }}
                      />
                    </View>
                  </View>
                ));
              })()}
            </View>
          </SectionCard>

          <SectionCard
            title="Age distribution"
            icon={Users}
            iconColor="#7DD3FC"
            subtitle="Across the last 30 days of viewers"
          >
            <View className="flex-row items-center gap-4">
              <View className="flex-1 flex-row items-end gap-1.5 h-40">
                {stat.ages.map((a, i) => (
                  <View key={a.bucket} className="flex-1 items-center gap-1">
                    <View
                      className="w-full rounded-md"
                      style={{
                        height: `${a.pct * 2}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <Text className="text-[9px] text-muted-foreground">
                      {a.bucket}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="gap-1.5">
                {stat.ages.map((a, i) => (
                  <View key={a.bucket} className="flex-row items-center gap-2">
                    <View
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <Text className="text-xs text-foreground">{a.bucket}</Text>
                    <Text className="text-xs text-muted-foreground">{a.pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          <SectionCard
            title="Peak viewing hours"
            icon={Users}
            iconColor="#7DD3FC"
            subtitle="Average concurrent viewers by hour of day (local timezone)"
          >
            <View>
              {(() => {
                const max = Math.max(1, ...stat.peakHours.map((h) => h.viewers));
                return (
                  <>
                    <View className="h-44 flex-row items-end gap-[2px]">
                      {stat.peakHours.map((h) => (
                        <View
                          key={h.hour}
                          className="flex-1 rounded-t-sm bg-fuchsia-500/70"
                          style={{
                            height: `${(h.viewers / max) * 100}%`,
                            minHeight: 2,
                          }}
                        />
                      ))}
                    </View>
                    <View className="mt-2 flex-row justify-between">
                      <Text className="text-[10px] text-muted-foreground">00:00</Text>
                      <Text className="text-[10px] text-muted-foreground">06:00</Text>
                      <Text className="text-[10px] text-muted-foreground">12:00</Text>
                      <Text className="text-[10px] text-muted-foreground">18:00</Text>
                      <Text className="text-[10px] text-muted-foreground">23:00</Text>
                    </View>
                    <Text className="mt-2 text-[11px] text-muted-foreground">
                      Peak: {stat.peakHours
                        .reduce((p, c) => (c.viewers > p.viewers ? c : p))
                        .hour}{" "}
                      · {max.toLocaleString()} viewers
                    </Text>
                  </>
                );
              })()}
            </View>
          </SectionCard>

          <SectionCard
            title="Devices"
            icon={Smartphone}
            iconColor="#7DD3FC"
            subtitle="What your audience watches on"
          >
            <View className="gap-3">
              {stat.devices.map((d, i) => (
                <View key={d.device} className="gap-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-foreground">{d.device}</Text>
                    <Text className="text-xs text-muted-foreground">{d.pct}%</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full bg-secondary">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${d.pct}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>
      )}
    </DashboardShell>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-border bg-card/40 p-5">
      <View className="mb-4">
        <View className="flex-row items-center gap-2">
          <Icon size={16} color={iconColor} />
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
        </View>
        {subtitle ? (
          <Text className="mt-0.5 text-[11px] text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
