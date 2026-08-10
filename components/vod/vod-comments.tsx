import { Text, View } from "react-native";
import { MessageCircle, MessageSquare } from "lucide-react-native";

/**
 * Comments backend does not exist yet (no /api/vods/[id]/comments).
 * Render an honest coming-soon state instead of seeded fake threads.
 * Props signature kept so existing call sites compile unchanged.
 */
export function VodComments(_props: { vodId: string }) {
  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <MessageCircle size={16} color="#9FBDBD" />
        <Text className="text-lg font-semibold text-foreground">Comments</Text>
      </View>
      <View className="items-center gap-2 rounded-xl border border-border bg-card/40 p-5">
        <MessageSquare size={20} color="#737373" />
        <Text className="text-sm text-muted-foreground">
          Comments are coming soon.
        </Text>
      </View>
    </View>
  );
}

export default VodComments;
