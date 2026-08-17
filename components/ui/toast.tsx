import * as React from "react";
import { useTokens } from "@/lib/theme/tokens";
import { Toaster as SonnerToaster, toast } from "sonner-native";

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster(props: ToasterProps) {
  const palette = useTokens();
  return (
    <SonnerToaster
      position="top-center"
      offset={48}
      duration={3500}
      closeButton
      style={{
        backgroundColor: palette.bg,
      }}
      toastOptions={{
        style: {
          backgroundColor: palette.bg,
        },
        titleStyle: { color: palette.fg },
        descriptionStyle: { color: palette.muted },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
