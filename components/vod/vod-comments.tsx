import { Text, View } from "react-native";

import { LiveChat } from "@/components/stream/live-chat";

/**
 * The conversation under a recording.
 *
 * This screen said "Comments are coming soon" because there was no endpoint
 * behind it, which was honest and is no longer true: the backend serves a
 * recording's chat from the same table, with the same rules, the same ban list
 * and the same live feed as a broadcast.
 *
 * So it is the chat component, pointed at a VOD. A second implementation would
 * have needed the rules, the bans and the moderation queue again, and would
 * have drifted from the first within a week.
 */
export function VodComments({ vodId }: { vodId: string }) {
  return (
    <View>
      {/* A fixed height, because a thread that grows the page pushes the
          related rail out of reach on a phone. */}
      <View className="h-[26rem] overflow-hidden rounded-xl bg-card/40">
        <LiveChat vodId={vodId} />
      </View>
      <Text className="mt-2 text-[11px] text-muted-foreground">
        Long-press a comment to reply to it.
      </Text>
    </View>
  );
}

export default VodComments;
