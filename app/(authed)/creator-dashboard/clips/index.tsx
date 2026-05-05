import * as React from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  Film,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react-native";
import { toast } from "sonner-native";

import { useMockAuth } from "@/components/providers";
import {
  approveClip,
  discardClip,
  listClipDrafts,
  publishClip,
  type ClipStatus,
  type CreatorClipDraft,
} from "@/lib/mock/creators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardShell } from "@/components/creators/dashboard-shell";
import { relativeTime } from "@/components/creators/relative-time";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<
  ClipStatus,
  { label: string; className: string; textClassName: string }
> = {
  pending: {
    label: "Awaiting review",
    className: "border-amber-500/40 bg-amber-500/10",
    textClassName: "text-amber-200",
  },
  approved: {
    label: "Approved",
    className: "border-sky-500/40 bg-sky-500/10",
    textClassName: "text-sky-200",
  },
  published: {
    label: "Published",
    className: "border-emerald-500/40 bg-emerald-500/10",
    textClassName: "text-emerald-200",
  },
  discarded: {
    label: "Discarded",
    className: "border-border bg-secondary",
    textClassName: "text-muted-foreground",
  },
};

type FilterTab = "pending" | "approved" | "published" | "all";

export default function CreatorClipsScreen() {
  const { user } = useMockAuth();
  const userId = user?.id ?? "user_current";
  const qc = useQueryClient();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const clipsQ = useQuery({
    queryKey: ["creator-clips", userId],
    queryFn: () => listClipDrafts(userId),
  });

  const clips = clipsQ.data ?? [];

  async function handleAction(
    id: string,
    action: "approve" | "publish" | "discard",
  ) {
    setBusyId(id);
    try {
      if (action === "approve") {
        await approveClip(id);
        toast.success("Clip approved", {
          description: "It's queued to publish in your next batch.",
        });
      } else if (action === "publish") {
        await publishClip(id);
        toast.success("Clip published");
      } else {
        await discardClip(id);
        toast("Clip discarded");
      }
      // Optimistic update of cache
      qc.setQueryData<CreatorClipDraft[]>(["creator-clips", userId], (prev) =>
        (prev ?? []).map((c) =>
          c.id === id
            ? {
                ...c,
                status:
                  action === "approve"
                    ? "approved"
                    : action === "publish"
                    ? "published"
                    : "discarded",
              }
            : c,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  const counts = clips.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ClipStatus, number>,
  );

  function filterClips(tab: FilterTab): CreatorClipDraft[] {
    if (tab === "all") return clips;
    return clips.filter((c) => c.status === tab);
  }

  return (
    <DashboardShell
      title="Auto-clipper queue"
      screenTitle="Clips"
      description="Highlights extracted from your last stream — approve, publish, or discard."
    >
      {clipsQ.isLoading ? (
        <View className="gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </View>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              {`Pending (${counts.pending ?? 0})`}
            </TabsTrigger>
            <TabsTrigger value="approved">
              {`Approved (${counts.approved ?? 0})`}
            </TabsTrigger>
            <TabsTrigger value="published">
              {`Published (${counts.published ?? 0})`}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          {(["pending", "approved", "published", "all"] as FilterTab[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <ClipList
                clips={filterClips(tab)}
                busyId={busyId}
                onAction={handleAction}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </DashboardShell>
  );
}

function ClipList({
  clips,
  busyId,
  onAction,
}: {
  clips: CreatorClipDraft[];
  busyId: string | null;
  onAction: (id: string, action: "approve" | "publish" | "discard") => void;
}) {
  if (clips.length === 0) {
    return (
      <View className="rounded-2xl border border-dashed border-border bg-card/30 p-10 items-center">
        <Film size={36} color="#525252" />
        <Text className="mt-3 text-sm font-semibold text-foreground">
          No clips here yet.
        </Text>
        <Text className="mt-1 text-center text-xs text-muted-foreground">
          Auto-clipper queues highlights at the end of every stream. Go live to fill this list.
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-4">
      {clips.map((c) => (
        <ClipCard key={c.id} clip={c} busyId={busyId} onAction={onAction} />
      ))}
    </View>
  );
}

function ClipCard({
  clip,
  busyId,
  onAction,
}: {
  clip: CreatorClipDraft;
  busyId: string | null;
  onAction: (id: string, action: "approve" | "publish" | "discard") => void;
}) {
  const status = STATUS_LABEL[clip.status];
  const isBusy = busyId === clip.id;

  return (
    <View
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/40",
        clip.status === "discarded"
          ? "border-border/60 opacity-50"
          : "border-border",
      )}
    >
      <View className="aspect-video bg-background relative">
        <Image
          source={{ uri: clip.thumbnailUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />
        <View className="absolute left-2 top-2">
          <Badge
            variant="outline"
            className={status.className}
            textClassName={status.textClassName + " text-[10px]"}
          >
            {status.label}
          </Badge>
        </View>
        <View className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5">
          <Text className="text-[11px] font-medium text-foreground">
            {clip.durationSec}s
          </Text>
        </View>
        <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded bg-amber-500/90 px-2 py-0.5">
          <Sparkles size={10} color="#451A03" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-amber-950">
            {clip.highlightScore}/100
          </Text>
        </View>
      </View>
      <View className="gap-3 p-4">
        <View>
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
            {clip.title}
          </Text>
          <Text className="mt-0.5 text-[11px] text-muted-foreground">
            from {clip.vodSourceTitle} · {relativeTime(clip.capturedAt)}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {clip.status === "pending" ? (
            <>
              <Button
                size="sm"
                onPress={() => onAction(clip.id, "approve")}
                disabled={isBusy}
                className="flex-1 bg-sky-500"
              >
                {isBusy ? (
                  <Spinner color="#0A0A0A" />
                ) : (
                  <Check size={14} color="#0A0A0A" />
                )}
                <Text className="text-sm font-semibold text-neutral-950">
                  Approve
                </Text>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => onAction(clip.id, "discard")}
                disabled={isBusy}
              >
                <Trash2 size={14} color="#FAFAFA" />
                <Text className="text-sm font-medium text-foreground">
                  Discard
                </Text>
              </Button>
            </>
          ) : clip.status === "approved" ? (
            <>
              <Button
                size="sm"
                onPress={() => onAction(clip.id, "publish")}
                disabled={isBusy}
                className="flex-1 bg-emerald-500"
              >
                {isBusy ? (
                  <Spinner color="#022C22" />
                ) : (
                  <Upload size={14} color="#022C22" />
                )}
                <Text className="text-sm font-semibold text-emerald-950">
                  Publish
                </Text>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => onAction(clip.id, "discard")}
                disabled={isBusy}
                className="px-3"
              >
                <Trash2 size={14} color="#FAFAFA" />
              </Button>
            </>
          ) : clip.status === "published" ? (
            <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1">
              <CheckCircle2 size={14} color="#6EE7B7" />
              <Text className="text-xs text-emerald-300">
                Live on your channel
              </Text>
            </View>
          ) : (
            <Text className="text-xs text-muted-foreground">
              Discarded — won't publish.
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
