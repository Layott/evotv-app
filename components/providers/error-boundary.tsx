import * as React from "react";
import { Pressable, Text, View } from "react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional reset handler. If omitted, "Try again" button re-mounts children. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  resetCount: number;
}

/**
 * Catches render-time and lifecycle errors in the subtree and shows a dark
 * fallback instead of a blank white screen. Mount near root + per group.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    resetCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (__DEV__) {
      console.error("[ErrorBoundary]", error.message, info.componentStack);
    }
  }

  reset = (): void => {
    this.setState((s) => ({
      hasError: false,
      error: null,
      resetCount: s.resetCount + 1,
    }));
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#0A0A0A",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              color: "#FAFAFA",
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: "#999",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 24,
            }}
            numberOfLines={5}
          >
            {this.state.error?.message ?? "Unknown error"}
          </Text>
          <Pressable
            onPress={this.reset}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: "#2CD7E3",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 14 }}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <React.Fragment key={this.state.resetCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
