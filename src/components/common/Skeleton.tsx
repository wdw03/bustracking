/* ============================================================================
   SHIMMER SKELETON LOADER — BusTracker
   Path: src/components/common/Skeleton.tsx
   Provides pulsing skeleton UI components for dynamic data loading
   ========================================================================== */

import React, { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

export function SkeletonItem({
    width,
    height,
    borderRadius = 12,
    style,
}: {
    width?: number | `${number}%` | "auto";
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.85,
                    duration: 650,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 650,
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                {
                    width: width ?? "100%",
                    height,
                    borderRadius,
                    backgroundColor: "#E2E8F0",
                    opacity,
                },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    return (
        <View
            style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
            }}
        >
            <SkeletonItem width={42} height={42} borderRadius={15} />
            <View style={{ flex: 1, gap: 6 }}>
                <SkeletonItem width="60%" height={14} borderRadius={6} />
                <SkeletonItem width="40%" height={11} borderRadius={4} />
            </View>
            <SkeletonItem width={28} height={28} borderRadius={10} />
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View style={{ width: "100%", paddingTop: 8 }}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </View>
    );
}
