import * as React from "react";
import { Toaster as SonnerToaster, toast } from "sonner-native";

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      offset={48}
      duration={3500}
      closeButton
      style={{
        backgroundColor: "#0A0A0A",
      }}
      toastOptions={{
        style: {
          backgroundColor: "#0A0A0A",
          borderColor: "#262626",
          borderWidth: 1,
        },
        titleStyle: { color: "#FAFAFA" },
        descriptionStyle: { color: "#A3A3A3" },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
