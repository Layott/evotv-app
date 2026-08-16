import * as React from "react";
import { Text, type TextProps } from "react-native";

import { getFxRate, formatPrice, type FxRate } from "@/lib/fx";

/**
 * A naira price rendered in the viewer's own money.
 *
 * The rate is fetched once per app session and shared, so a shop grid makes one
 * request between all of its cards. Until it arrives the naira figure is shown,
 * which is the real price and therefore never wrong, only less useful.
 */
export function Price({
  ngn,
  ...rest
}: { ngn: number } & Omit<TextProps, "children">) {
  const [fx, setFx] = React.useState<FxRate | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void getFxRate().then((r) => {
      if (!cancelled) setFx(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <Text {...rest}>{formatPrice(ngn, fx)}</Text>;
}
