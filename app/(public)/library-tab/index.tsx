import * as React from "react";
import { View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

/**
 * Library tab — same redirect pattern as profile-tab. See that file's comment.
 */
export default function LibraryTabRedirect() {
  const router = useRouter();
  useFocusEffect(
    React.useCallback(() => {
      router.replace("/library" as never);
    }, [router]),
  );
  return <View style={{ flex: 1, backgroundColor: "#0A0A0A" }} />;
}
