import * as React from "react";
import { Text, View, type ViewProps } from "react-native";
import { Image, type ImageProps } from "expo-image";

import { cn } from "@/lib/utils";

interface AvatarContextValue {
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
  imageError: boolean;
  setImageError: (error: boolean) => void;
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
  const ctx = React.useContext(AvatarContext);
  if (!ctx) throw new Error("Avatar subcomponents must be used within <Avatar>");
  return ctx;
}

export interface AvatarProps extends ViewProps {
  className?: string;
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, children, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    return (
      <AvatarContext.Provider
        value={{ imageLoaded, setImageLoaded, imageError, setImageError }}
      >
        <View
          ref={ref}
          className={cn(
            "relative h-8 w-8 shrink-0 overflow-hidden rounded-full",
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = "Avatar";

export interface AvatarImageProps
  extends Omit<ImageProps, "source"> {
  source?: ImageProps["source"];
  src?: string;
  className?: string;
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof Image>,
  AvatarImageProps
>(({ className, src, source, onLoad, onError, ...props }, ref) => {
  const ctx = useAvatarContext();
  const resolvedSource = source ?? (src ? { uri: src } : undefined);

  if (!resolvedSource || ctx.imageError) return null;

  return (
    <Image
      ref={ref}
      source={resolvedSource}
      onLoad={(e) => {
        ctx.setImageLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        ctx.setImageError(true);
        onError?.(e);
      }}
      contentFit="cover"
      className={cn("absolute inset-0 h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

export interface AvatarFallbackProps extends ViewProps {
  className?: string;
  textClassName?: string;
}

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ className, textClassName, children, ...props }, ref) => {
    const ctx = useAvatarContext();
    if (ctx.imageLoaded && !ctx.imageError) return null;

    return (
      <View
        ref={ref}
        className={cn(
          "h-full w-full items-center justify-center rounded-full bg-muted",
          className,
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text
                className={cn(
                  "text-sm font-medium text-muted-foreground",
                  textClassName,
                )}
              >
                {child}
              </Text>
            );
          }
          return child;
        })}
      </View>
    );
  },
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
