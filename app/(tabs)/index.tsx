import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { ShieldHero } from '@/components/ui/shield-hero';

type ShieldState = 'idle' | 'processing' | 'completed';

export default function ShieldHubScreen() {
  const [status, setStatus] = useState<ShieldState>('idle');
  const [noiseIntensity, setNoiseIntensity] = useState(48);
  const [hasSelection, setHasSelection] = useState(false);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ).start();
  }, [shimmer]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['-120%', '120%'],
  });

  const statusLabel = useMemo(() => {
    if (status === 'processing') return 'Processing adversarial protection...';
    if (status === 'completed') return 'Image secured successfully.';
    return 'Upload an image and set noise level to begin.';
  }, [status]);

  const handleUploadPress = () => {
    setHasSelection(true);
    setStatus('idle');
  };

  const handleProtectPress = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('completed');
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topSection}>
        <Text style={styles.title}>Shield Hub</Text>
        <Text style={styles.subtitle}>Adversarial protection for sensitive imagery.</Text>
      </View>

      <View style={styles.heroSection}>
        <ShieldHero size={220} />
        <View style={styles.heroLabel}>
          <Text style={styles.heroLabelText}>Active protection field</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.uploadZone} onPress={handleUploadPress} activeOpacity={0.9}>
        <Text style={styles.uploadTitle}>Tap to upload image</Text>
        <Text style={styles.uploadHint}>{hasSelection ? 'Image ready for processing' : 'Select from gallery or camera'}</Text>
        {hasSelection && <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />}
      </TouchableOpacity>

      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Adversarial Noise Intensity</Text>
          <Text style={styles.sliderValue}>{noiseIntensity}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={10}
          maximumValue={100}
          step={1}
          value={noiseIntensity}
          minimumTrackTintColor="#0EF6FF"
          maximumTrackTintColor="#29303F"
          thumbTintColor="#0EF6FF"
          onValueChange={setNoiseIntensity}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, hasSelection ? styles.actionButtonActive : styles.actionButtonDisabled]}
          disabled={!hasSelection || status === 'processing'}
          onPress={handleProtectPress}
          activeOpacity={0.9}
        >
          <Text style={styles.actionButtonText}>Protect Image</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status</Text>
        <Text style={styles.statusText}>{statusLabel}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05060B',
    padding: 20,
  },
  topSection: {
    gap: 8,
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9AA3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  heroLabel: {
    marginTop: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  heroLabelText: {
    color: '#0EF6FF',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadZone: {
    marginVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 24,
    overflow: 'hidden',
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  uploadHint: {
    color: '#9AA3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14,246,255,0.12)',
    opacity: 0.65,
  },
  sliderSection: {
    marginTop: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#0E111C',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.1)',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderValue: {
    color: '#0EF6FF',
    fontSize: 14,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actionsRow: {
    marginTop: 18,
  },
  actionButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#0EF6FF',
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(14,246,255,0.18)',
  },
  actionButtonText: {
    color: '#05060B',
    fontWeight: '800',
    fontSize: 16,
  },
  statusCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusText: {
    color: '#9AA3B8',
    fontSize: 13,
    lineHeight: 20,
  },
});
