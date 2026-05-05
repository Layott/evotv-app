import * as React from "react";
import { Text, TextInput, View } from "react-native";
import { MessageCircle } from "lucide-react-native";
import { toast } from "sonner-native";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMockAuth } from "@/components/providers";

interface Comment {
  id: string;
  handle: string;
  avatarUrl: string;
  body: string;
  createdAt: string;
  likes: number;
}

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function seed(vodId: string): Comment[] {
  const base = [
    {
      handle: "viper",
      body: "That rotation at minute 12 is a masterclass.",
      mins: 10,
      likes: 48,
    },
    {
      handle: "shadow",
      body: "GOATed commentary. Replay value through the roof.",
      mins: 120,
      likes: 22,
    },
    {
      handle: "blaze",
      body: "Whoever edited the highlight cuts — raise.",
      mins: 360,
      likes: 71,
    },
    {
      handle: "havoc",
      body: "Did anyone else clip the 1v4? I need it.",
      mins: 720,
      likes: 14,
    },
    {
      handle: "rex",
      body: "Film Room made me see the meta differently.",
      mins: 60 * 24,
      likes: 93,
    },
    {
      handle: "nyx",
      body: "More like this please.",
      mins: 60 * 24 * 2,
      likes: 9,
    },
  ];
  return base.map((c, i) => ({
    id: `cm_${vodId}_${i}`,
    handle: c.handle,
    avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${c.handle}`,
    body: c.body,
    createdAt: new Date(Date.now() - c.mins * 60_000).toISOString(),
    likes: c.likes,
  }));
}

export function VodComments({ vodId }: { vodId: string }) {
  const { user } = useMockAuth();
  const [comments, setComments] = React.useState<Comment[]>(() => seed(vodId));
  const [draft, setDraft] = React.useState("");

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    if (!user) {
      toast.error("Sign in to comment");
      return;
    }
    const newComment: Comment = {
      id: `cm_local_${Date.now()}`,
      handle: user.handle,
      avatarUrl: user.avatarUrl,
      body,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    setComments((prev) => [newComment, ...prev]);
    setDraft("");
    toast.success("Comment posted");
  };

  return (
    <View>
      <View className="mb-3 flex-row items-center gap-2">
        <MessageCircle size={16} color="#a3a3a3" />
        <Text className="text-lg font-semibold text-foreground">
          Comments{" "}
          <Text className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </Text>
        </Text>
      </View>

      <View className="mb-5 flex-row gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl} />
          <AvatarFallback>
            {(user?.handle ?? "gu").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <View className="flex-1 gap-2">
          <TextInput
            value={draft}
            onChangeText={(t) => setDraft(t.slice(0, 500))}
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            placeholderTextColor="#737373"
            multiline
            editable={!!user}
            numberOfLines={2}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            style={{ minHeight: 60, textAlignVertical: "top" }}
          />
          <View className="flex-row items-center justify-between">
            <Text style={{ fontSize: 10, color: "#737373" }}>
              {draft.length} / 500
            </Text>
            <Button
              size="sm"
              onPress={post}
              disabled={!user || !draft.trim()}
              className="bg-brand"
              textClassName="text-black font-semibold"
            >
              Post
            </Button>
          </View>
        </View>
      </View>

      <View className="gap-4">
        {comments.map((c) => (
          <View key={c.id} className="flex-row gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={c.avatarUrl} />
              <AvatarFallback>
                {c.handle.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-semibold text-foreground">
                  {c.handle}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {relTime(c.createdAt)}
                </Text>
              </View>
              <Text className="mt-1 text-sm text-foreground">{c.body}</Text>
              <Text
                className="mt-1 text-xs text-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {c.likes} likes
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default VodComments;
