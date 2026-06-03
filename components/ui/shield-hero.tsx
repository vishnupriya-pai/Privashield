import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const ACCENT = '#0EF6FF';

export function ShieldHero({ size = 180 }: { size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.35, 0.15],
  });

  return (
    <View style={[styles.root, { width: size, height: size }]}> 
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 0.95,
            height: size * 0.95,
            borderRadius: size * 0.475,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          },
        ]}
      />
      <View style={[styles.shieldShell, { width: size * 0.64, height: size * 0.78 }]}> 
        <View style={styles.shieldInner} />
      </View>
      <View style={[styles.pulseRing, { width: size * 0.5, height: size * 0.5, borderColor: ACCENT }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: 'rgba(14,246,255,0.08)',
  },
  shieldShell: {
    borderRadius: 48,
    backgroundColor: 'rgba(15, 20, 34, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0EF6FF',
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  shieldInner: {
    width: '62%',
    height: '64%',
    backgroundColor: '#0EF6FF',
    borderRadius: 40,
    opacity: 0.95,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
    opacity: 0.55,
  },
});
