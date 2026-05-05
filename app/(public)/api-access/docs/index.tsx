import * as React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { toast } from "sonner-native";
import { Copy } from "lucide-react-native";

import { API_DOC_ENDPOINTS } from "@/lib/mock/api-keys";
import { Button } from "@/components/ui/button";
import { ApiAccessTabs } from "@/components/api-access/shell";

const METHOD_TONES: Record<string, { bg: string; fg: string }> = {
  GET: { bg: "rgba(16,185,129,0.15)", fg: "#34d399" },
  POST: { bg: "rgba(56,189,248,0.15)", fg: "#7dd3fc" },
  DELETE: { bg: "rgba(239,68,68,0.15)", fg: "#f87171" },
  PUT: { bg: "rgba(245,158,11,0.15)", fg: "#fbbf24" },
};

interface CodeBlockProps {
  label: string;
  code: string;
  onCopy: () => void;
}

function CodeBlock({ label, code, onCopy }: CodeBlockProps) {
  return (
    <View
      className="overflow-hidden rounded-xl border border-border"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <View className="flex-row items-center justify-between border-b border-border px-3 py-1.5">
        <Text
          style={{
            fontSize: 10,
            color: "#737373",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
        <Pressable
          onPress={onCopy}
          className="flex-row items-center gap-1 rounded px-2 py-1 active:opacity-70"
        >
          <Copy size={11} color="#a3a3a3" />
          <Text className="text-xs text-muted-foreground">Copy</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="px-3 py-3">
          <Text
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "#e5e5e5",
              lineHeight: 16,
            }}
          >
            {code}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export default function ApiDocsScreen() {
  const router = useRouter();

  const copy = (label: string) => {
    toast.success(`${label} copied`);
  };

  return (
    <>
      <Stack.Screen options={{ title: "API Docs" }} />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="pt-4 pb-3">
          <ApiAccessTabs active="docs" />
        </View>

        <View className="px-4 gap-5">
          <View className="rounded-xl border border-border bg-card p-4 gap-2">
            <Text className="text-base font-semibold text-foreground">
              Quick start
            </Text>
            <Text className="text-sm text-muted-foreground">
              All endpoints accept{" "}
              <Text style={{ fontFamily: "monospace" }}>
                Authorization: Bearer YOUR_KEY
              </Text>
              . JSON only. Rate-limited to ~50 req/sec per key.
            </Text>
            <View className="flex-row flex-wrap gap-2 mt-1">
              <Button
                size="sm"
                variant="outline"
                onPress={() => router.push("/api-access/keys")}
              >
                Get a key
              </Button>
            </View>
          </View>

          {API_DOC_ENDPOINTS.map((section) => (
            <View key={section.section} className="gap-3">
              <Text
                className="text-xs font-semibold uppercase text-muted-foreground"
                style={{ letterSpacing: 0.5 }}
              >
                {section.section}
              </Text>
              {section.items.map((endpoint) => {
                const tone = METHOD_TONES[endpoint.method] ?? METHOD_TONES.GET;
                const curl = `curl https://api.evo.tv${endpoint.path.replace(
                  /\{(\w+)\}/g,
                  "<$1>",
                )} \\\n  -H "Authorization: Bearer evo_live_***"`;
                const sample = JSON.stringify(endpoint.sample, null, 2);

                return (
                  <View
                    key={endpoint.id}
                    className="rounded-xl border border-border bg-card p-4 gap-3"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="rounded-md px-2 py-0.5"
                        style={{ backgroundColor: tone.bg }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: tone.fg,
                            letterSpacing: 0.5,
                          }}
                        >
                          {endpoint.method}
                        </Text>
                      </View>
                      <Text
                        className="text-foreground"
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      >
                        {endpoint.path}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-foreground">
                      {endpoint.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </Text>

                    {endpoint.params.length > 0 ? (
                      <View className="flex-row flex-wrap gap-1.5">
                        {endpoint.params.map((p) => (
                          <View
                            key={p}
                            className="rounded-md px-2 py-0.5"
                            style={{ backgroundColor: "rgba(64,64,64,0.6)" }}
                          >
                            <Text
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                                color: "#d4d4d4",
                              }}
                            >
                              {p}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <View className="gap-2 mt-1">
                      <CodeBlock
                        label="cURL"
                        code={curl}
                        onCopy={() => copy("cURL")}
                      />
                      <CodeBlock
                        label="Sample response"
                        code={sample}
                        onCopy={() => copy("Response")}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
