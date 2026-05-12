import * as React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TopNavbar } from "@/components/home/top-navbar";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LiveNowSection } from "@/components/home/live-now-section";
import { Recommendations } from "@/components/home/recommendations";
import { TrendingClipsSection } from "@/components/home/trending-clips-section";
import { UpcomingEventsSection } from "@/components/home/upcoming-events-section";
import { AdBanner } from "@/components/home/ad-banner";
import { QuickAccess } from "@/components/home/quick-access";
import { listFeaturedStreams, listLiveStreams } from "@/lib/api/streams";
import { listVods, listTrendingClips } from "@/lib/api/vods";
import { listEvents } from "@/lib/api/events";
import { listGames } from "@/lib/api/games";

const SECTION_DURATION = 420;
const SECTION_STEP = 90;
const section = (idx: number) =>
  FadeInDown.duration(SECTION_DURATION).delay(idx * SECTION_STEP);

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const featured = useQuery({ queryKey: ["home", "featured"], queryFn: () => listFeaturedStreams() });
  const live = useQuery({ queryKey: ["home", "live"], queryFn: () => listLiveStreams() });
  const events = useQuery({ queryKey: ["home", "events"], queryFn: () => listEvents({ status: "scheduled" }) });
  const clips = useQuery({ queryKey: ["home", "clips"], queryFn: () => listTrendingClips() });
  const vods = useQuery({ queryKey: ["home", "vods"], queryFn: () => listVods({ limit: 12 }) });
  const gamesQ = useQuery({ queryKey: ["games"], queryFn: () => listGames() });
  const games = gamesQ.data ?? [];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["home"] });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <View className="flex-1 bg-background">
      <TopNavbar />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2CD7E3"
            colors={["#2CD7E3"]}
            progressBackgroundColor="#0A0A0A"
          />
        }
      >
        <View className="gap-6">
          <Animated.View entering={section(0)}>
            <HeroCarousel streams={featured.data ?? []} />
          </Animated.View>
          <Animated.View entering={section(1)}>
            <QuickAccess />
          </Animated.View>
          <Animated.View entering={section(2)}>
            <LiveNowSection streams={live.data ?? []} games={games} loading={live.isLoading} />
          </Animated.View>
          <Animated.View entering={section(3)}>
            <AdBanner />
          </Animated.View>
          <Animated.View entering={section(4)}>
            <UpcomingEventsSection events={events.data ?? []} games={games} loading={events.isLoading} />
          </Animated.View>
          <Animated.View entering={section(5)}>
            <TrendingClipsSection clips={clips.data ?? []} loading={clips.isLoading} />
          </Animated.View>
          <Animated.View entering={section(6)}>
            <Recommendations vods={vods.data ?? []} games={games} loading={vods.isLoading} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
