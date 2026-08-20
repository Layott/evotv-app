import * as React from "react";
import { Pressable, Text, View } from "react-native";

import { ChevronDown, Info } from "@/components/icons";
import { useTokens } from "@/lib/theme/tokens";
import { persist, syncGet } from "@/lib/storage/persist";
import { HOW_TO, type HowToContent, type HowToKey } from "@/lib/admin/how-to-content";

/**
 * What this page is for, on the page.
 *
 * The website's admin carries one of these on every screen and the app carried
 * none, so the person running a broadcast from a phone had the harder job and
 * less to go on. Same words, same file: `lib/admin/how-to-content.ts` is a copy
 * of the backend's, which keeps the two dashboards saying the same thing about
 * the same control.
 *
 * Open the first time, closed after that, remembered per page.
 */

const STORAGE_PREFIX = "evotv:howto:";

export function HowTo({ page }: { page: HowToKey }) {
  const palette = useTokens();
  // Widened to the shared shape: the literal type of one entry only carries the
  // keys that entry happens to use, which makes optional fields unreachable.
  const content: HowToContent | undefined = HOW_TO[page];
  const key = STORAGE_PREFIX + page;
  const [open, setOpen] = React.useState(() => syncGet(key) !== "closed");

  React.useEffect(() => {
    let alive = true;
    void persist.get<string>(key).then((value) => {
      if (alive && value) setOpen(value !== "closed");
    });
    return () => {
      alive = false;
    };
  }, [key]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      void persist.set(key, next ? "open" : "closed");
      return next;
    });
  }

  if (!content) return null;

  return (
    <View className="mb-4 overflow-hidden rounded-xl" style={{ backgroundColor: palette.surface }}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-2 px-3 py-3 active:opacity-70"
      >
        <Info size={15} color={palette.brand} />
        <Text className="flex-1 text-sm font-semibold text-foreground">
          {content.title}
        </Text>
        <Text className="text-[11px] text-muted-foreground">
          {open ? "Hide" : "Show"}
        </Text>
        <ChevronDown
          size={14}
          color={palette.muted}
          style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {open ? (
        <View className="gap-3 px-3 pb-3">
          <Text className="text-[13px] text-muted-foreground">{content.intro}</Text>

          {content.points.length > 0 ? (
            <View className="gap-1.5">
              {content.points.map((point) => (
                <View
                  key={point.term}
                  className="rounded-lg p-2.5"
                  style={{ backgroundColor: palette.bg }}
                >
                  <Text className="text-[11px] font-semibold text-foreground">
                    {point.term}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-muted-foreground">
                    {point.detail}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {content.steps && content.steps.length > 0 ? (
            <View>
              <Text className="mb-1.5 text-[11px] font-semibold text-foreground">
                {content.stepsTitle ?? "The usual job, in order"}
              </Text>
              {content.steps.map((step: string, i: number) => (
                <View key={step} className="mb-1 flex-row gap-2.5">
                  <Text className="text-[11px]" style={{ color: palette.brand }}>
                    {i + 1}
                  </Text>
                  <Text className="flex-1 text-[11px] text-muted-foreground">{step}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {content.watchOut ? (
            <View className="rounded-lg p-2.5" style={{ backgroundColor: "rgba(245,158,11,.15)" }}>
              <Text className="text-[11px]" style={{ color: "#fde68a" }}>
                {content.watchOut}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default HowTo;
