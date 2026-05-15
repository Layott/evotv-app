import * as React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

import type { Ad, AdPlacement } from "@/lib/types";
import { recordAdClick, recordAdImpression, serveAd } from "@/lib/api/ads";

interface AdBannerProps {
  placement?: AdPlacement;
}

export function AdBanner({ placement = "home_banner" }: AdBannerProps) {
  const [ad, setAd] = React.useState<Ad | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { ad: next } = await serveAd(placement);
        if (cancelled) return;
        setAd(next);
        if (next) {
          void recordAdImpression(next.id).catch(() => {
            /* fire-and-forget */
          });
        }
      } catch {
        /* swallow — ad slot just stays empty if backend is down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!ad) return null;

  const open = async () => {
    try {
      const { clickUrl } = await recordAdClick(ad.id);
      void Linking.openURL(clickUrl || ad.clickUrl);
    } catch {
      void Linking.openURL(ad.clickUrl);
    }
  };

  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={`Sponsored: ${ad.advertiser}`}
      className="overflow-hidden rounded-xl border border-border bg-card active:opacity-80"
    >
      <View className="relative">
        <Image
          source={ad.mediaUrl}
          style={{ height: 96, width: "100%" }}
          contentFit="cover"
        />
        <View
          className="absolute right-2 top-2 rounded-md px-2 py-0.5"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              letterSpacing: 1,
              color: "#a3a3a3",
            }}
          >
            AD &middot; {ad.advertiser.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default AdBanner;
