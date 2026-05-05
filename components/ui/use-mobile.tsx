import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    Dimensions.get("window").width < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setIsMobile(window.width < MOBILE_BREAKPOINT);
    });
    return () => sub.remove();
  }, []);

  return isMobile;
}
