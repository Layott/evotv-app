import * as React from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Flag, X } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";

import {
  submitReport,
  type ReportCategory,
  type ReportTargetType,
} from "@/lib/api/reports";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS: { value: ReportCategory; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "abuse", label: "Abuse / harassment" },
  { value: "copyright", label: "Copyright" },
  { value: "impersonation", label: "Impersonation" },
  { value: "illegal", label: "Illegal content" },
  { value: "csam", label: "CSAM" },
  { value: "other", label: "Other" },
];

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Optional render override for the trigger. Defaults to a Flag icon + "Report" label. */
  trigger?: (open: () => void) => React.ReactNode;
}

export function ReportButton({
  targetType,
  targetId,
  trigger,
}: ReportButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<ReportCategory | null>(null);
  const [details, setDetails] = React.useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitReport({
        targetType,
        targetId,
        category: category!,
        details: details.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Report submitted", {
        description: "Our team will review it shortly.",
      });
      setOpen(false);
      setCategory(null);
      setDetails("");
    },
    onError: (err) => {
      toast.error("Couldn't submit report", {
        description: err instanceof Error ? err.message : String(err),
      });
    },
  });

  const openModal = () => setOpen(true);

  return (
    <>
      {trigger ? (
        trigger(openModal)
      ) : (
        <Pressable
          onPress={openModal}
          accessibilityLabel="Report content"
          className="flex-row items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5"
        >
          <Flag size={12} color="#A3A3A3" />
          <Text className="text-xs text-muted-foreground">Report</Text>
        </Pressable>
      )}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="max-h-[85%] rounded-t-2xl border border-border bg-background p-5"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">
                Report this {targetType.replace("_", " ")}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <X size={20} color="#A3A3A3" />
              </Pressable>
            </View>

            <Text className="mb-2 text-xs text-muted-foreground">Category</Text>
            <View className="mb-4 flex-row flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  className={`rounded-md border px-3 py-1.5 ${
                    category === c.value
                      ? "border-brand bg-brand/15"
                      : "border-border bg-card"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      category === c.value ? "text-brand" : "text-foreground"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="mb-1.5 text-xs text-muted-foreground">
              Details (optional)
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="What did you see? Add timestamps or links if relevant."
              placeholderTextColor="#737373"
              multiline
              numberOfLines={4}
              maxLength={2000}
              className="rounded-md border border-border bg-card p-3 text-sm text-foreground"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />

            <Button
              onPress={() => mutation.mutate()}
              disabled={!category || mutation.isPending}
              className="mt-4 h-11 bg-brand"
            >
              <Text className="text-sm font-semibold text-black">
                {mutation.isPending ? "Sending…" : "Submit report"}
              </Text>
            </Button>
            <Text className="mt-2 text-center text-[11px] text-muted-foreground">
              Reports are reviewed by EVO TV staff. False reports may result in
              your own account being limited.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
