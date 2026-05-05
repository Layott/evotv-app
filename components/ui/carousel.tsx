import * as React from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  View,
  type FlatListProps,
  type ViewProps,
} from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

import { cn } from "@/lib/utils";

export type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  selectedIndex: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

interface CarouselContextValue extends CarouselApi {
  orientation: "horizontal" | "vertical";
  registerItem: (index: number) => void;
  itemCount: number;
  setItemCount: (n: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used within <Carousel>");
  return ctx;
}

export interface CarouselProps extends ViewProps {
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  className?: string;
}

const Carousel = React.forwardRef<View, CarouselProps>(
  ({ className, orientation = "horizontal", setApi, children, ...props }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [itemCount, setItemCount] = React.useState(0);
    const listRef = React.useRef<FlatList | null>(null);

    const scrollTo = React.useCallback((index: number) => {
      const next = Math.max(0, index);
      setSelectedIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, []);

    const scrollPrev = React.useCallback(() => {
      scrollTo(Math.max(0, selectedIndex - 1));
    }, [scrollTo, selectedIndex]);

    const scrollNext = React.useCallback(() => {
      scrollTo(Math.min(itemCount - 1, selectedIndex + 1));
    }, [itemCount, scrollTo, selectedIndex]);

    const canScrollPrev = selectedIndex > 0;
    const canScrollNext = selectedIndex < itemCount - 1;

    const registerItem = React.useCallback(() => undefined, []);

    React.useEffect(() => {
      setApi?.({
        scrollPrev,
        scrollNext,
        scrollTo,
        selectedIndex,
        canScrollPrev,
        canScrollNext,
      });
    }, [
      canScrollNext,
      canScrollPrev,
      scrollNext,
      scrollPrev,
      scrollTo,
      selectedIndex,
      setApi,
    ]);

    const ctxValue = React.useMemo<CarouselContextValue>(
      () => ({
        orientation,
        scrollPrev,
        scrollNext,
        scrollTo,
        selectedIndex,
        canScrollPrev,
        canScrollNext,
        registerItem,
        itemCount,
        setItemCount,
      }),
      [
        canScrollNext,
        canScrollPrev,
        itemCount,
        orientation,
        registerItem,
        scrollNext,
        scrollPrev,
        scrollTo,
        selectedIndex,
      ],
    );

    return (
      <CarouselContext.Provider value={ctxValue}>
        <View
          ref={ref}
          className={cn("relative", className)}
          accessibilityRole="adjustable"
          {...props}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            return React.cloneElement(
              child as React.ReactElement<{
                _carouselListRef?: React.MutableRefObject<FlatList | null>;
                _carouselSetIndex?: (n: number) => void;
              }>,
              {
                _carouselListRef: listRef,
                _carouselSetIndex: setSelectedIndex,
              },
            );
          })}
        </View>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

export interface CarouselContentProps<T = unknown>
  extends Omit<FlatListProps<T>, "data" | "renderItem"> {
  className?: string;
  children?: React.ReactNode;
}

const CarouselContent = React.forwardRef<FlatList, CarouselContentProps>(
  ({ className, children, ...props }, ref) => {
    const ctx = useCarousel();
    const items = React.Children.toArray(children);

    React.useEffect(() => {
      ctx.setItemCount(items.length);
    }, [items.length, ctx]);

    const internalRef = React.useRef<FlatList | null>(null);
    const innerProps = props as unknown as {
      _carouselListRef?: React.MutableRefObject<FlatList | null>;
      _carouselSetIndex?: (n: number) => void;
    };
    const screen = Dimensions.get("window");

    return (
      <FlatList
        ref={(node) => {
          internalRef.current = node;
          if (innerProps._carouselListRef)
            innerProps._carouselListRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref)
            (ref as React.MutableRefObject<FlatList | null>).current = node;
        }}
        data={items}
        keyExtractor={(_item, idx) => String(idx)}
        renderItem={({ item }) => <>{item as React.ReactNode}</>}
        horizontal={ctx.orientation === "horizontal"}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const offset =
            ctx.orientation === "horizontal"
              ? e.nativeEvent.contentOffset.x
              : e.nativeEvent.contentOffset.y;
          const dim =
            ctx.orientation === "horizontal" ? screen.width : screen.height;
          const idx = Math.round(offset / Math.max(1, dim));
          innerProps._carouselSetIndex?.(idx);
        }}
        className={cn(className)}
        {...(props as object)}
      />
    );
  },
);
CarouselContent.displayName = "CarouselContent";

export interface CarouselItemProps extends ViewProps {
  className?: string;
}

const CarouselItem = React.forwardRef<View, CarouselItemProps>(
  ({ className, style, ...props }, ref) => {
    const screen = Dimensions.get("window");
    return (
      <View
        ref={ref}
        accessibilityRole="none"
        style={[{ width: screen.width }, style]}
        className={cn("min-w-0 shrink-0 grow-0", className)}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "CarouselItem";

export interface CarouselNavProps extends ViewProps {
  className?: string;
}

const CarouselPrevious = React.forwardRef<View, CarouselNavProps>(
  ({ className, ...props }, ref) => {
    const ctx = useCarousel();
    return (
      <View
        ref={ref}
        className={cn(
          "absolute left-2 top-1/2",
          className,
        )}
        style={{ transform: [{ translateY: -16 }] }}
        {...props}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous slide"
          disabled={!ctx.canScrollPrev}
          onPress={ctx.scrollPrev}
          className={cn(
            "h-8 w-8 items-center justify-center rounded-full border border-input bg-background",
            !ctx.canScrollPrev && "opacity-50",
          )}
        >
          <ArrowLeft size={16} color="#FAFAFA" />
        </Pressable>
      </View>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<View, CarouselNavProps>(
  ({ className, ...props }, ref) => {
    const ctx = useCarousel();
    return (
      <View
        ref={ref}
        className={cn(
          "absolute right-2 top-1/2",
          className,
        )}
        style={{ transform: [{ translateY: -16 }] }}
        {...props}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next slide"
          disabled={!ctx.canScrollNext}
          onPress={ctx.scrollNext}
          className={cn(
            "h-8 w-8 items-center justify-center rounded-full border border-input bg-background",
            !ctx.canScrollNext && "opacity-50",
          )}
        >
          <ArrowRight size={16} color="#FAFAFA" />
        </Pressable>
      </View>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
