import * as React from "react";
import { ScrollView, Text, View } from "react-native";

/**
 * Minimal markdown-ish renderer for the bundled legal docs. Not a full
 * markdown engine — just splits on blank lines + recognizes:
 *   # heading        → 2xl bold
 *   ## subheading    → lg bold
 *   ### subheading2  → base semibold
 *   - bullet         → bullet point
 *   **bold**         → bold inline (within a paragraph)
 *   ---              → horizontal rule (rendered as a border)
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  // Split on **bold** spans.
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={`${keyPrefix}-${i}`} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

interface LegalDocProps {
  title: string;
  body: string;
}

export function LegalDoc({ title, body }: LegalDocProps) {
  const blocks = body.split(/\n\n+/);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      <Text className="text-3xl font-bold text-foreground mb-2">{title}</Text>

      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (trimmed === "---") {
          return (
            <View
              key={idx}
              className="my-4 h-px"
              style={{ backgroundColor: "#262626" }}
            />
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <Text
              key={idx}
              className="text-2xl font-bold text-foreground mt-4 mb-2"
            >
              {trimmed.slice(2)}
            </Text>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <Text
              key={idx}
              className="text-lg font-bold text-foreground mt-4 mb-2"
            >
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <Text
              key={idx}
              className="text-base font-semibold text-foreground mt-3 mb-1.5"
            >
              {trimmed.slice(4)}
            </Text>
          );
        }
        // Bullet block (every line starts with "- ")
        const lines = trimmed.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <View key={idx} className="mb-3 gap-1">
              {lines.map((l, li) => (
                <View key={li} className="flex-row gap-2">
                  <Text className="text-sm text-muted-foreground">•</Text>
                  <Text className="flex-1 text-sm text-foreground leading-5">
                    {renderInline(l.trim().slice(2), `b-${idx}-${li}`)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={idx} className="text-sm text-foreground leading-5 mb-3">
            {renderInline(trimmed, `p-${idx}`)}
          </Text>
        );
      })}
    </ScrollView>
  );
}
