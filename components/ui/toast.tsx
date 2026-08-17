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
        backgroundColor: "#05191B",
      }}
      toastOptions={{
        style: {
          backgroundColor: "#05191B",
        },
        titleStyle: { color: "#EAF6F5" },
        descriptionStyle: { color: "#9FBDBD" },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
