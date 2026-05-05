import { toast } from "sonner-native";

export function useToast() {
  return {
    toast: (props: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      const message = props.title ?? "";
      const description = props.description;
      if (props.variant === "destructive") {
        return toast.error(message, { description });
      }
      return toast(message, { description });
    },
    dismiss: (id?: string | number) => toast.dismiss(id),
  };
}

export { toast };
