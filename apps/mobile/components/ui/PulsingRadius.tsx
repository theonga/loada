import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface PulseRingProps {
  color: string;
  size: number;
  delay: number;
}

const ANIM_DURATION = 1800;

function PulseRing({ color, size, delay }: PulseRingProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  // Start at 0.3 so the ring is already a decent size when it becomes visible
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 0.5, 1],
    outputRange: [0, 0.9, 0.55, 0],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

interface PulsingRadiusProps {
  /** Accent color for the rings — amber for shipper, green for driver */
  color: string;
  /** Diameter of the outer ring in logical pixels (default 220) */
  size?: number;
  visible?: boolean;
}

/**
 * Centered screen overlay that emits two staggered pulsing rings from the
 * map's focal point. Works because all home screens always animateToRegion
 * on the user's position, keeping the user at screen centre.
 */
export function PulsingRadius({ color, size = 420, visible = true }: PulsingRadiusProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {/* Inner ring — starts first, ~55% of outer */}
        <PulseRing color={color} size={size * 0.55} delay={0} />
        {/* Outer ring — offset by half the duration so they stagger */}
        <PulseRing color={color} size={size} delay={ANIM_DURATION / 2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
