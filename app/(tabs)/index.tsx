import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { getApiBaseUrl } from '@/constants/api';
import { addVaultItem } from '@/lib/vault-store';

type ShieldState = 'idle' | 'processing' | 'completed' | 'error';

const PREVIEW_COLORS = ['#142D3B', '#1B263B', '#1C2A3F', '#10202F', '#1A2940', '#0E1F30'];

function randomId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

export default function ShieldHubScreen() {
  const [status, setStatus] = useState<ShieldState>('idle');
  const [noiseIntensity, setNoiseIntensity] = useState(48);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [protectedUri, setProtectedUri] = useState<string | null>(null);
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

  const handleUploadPress = async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setProtectedUri(null);
      setStatus('idle');
    }
  };

  const handleGenerate = async () => {
    if (!imageUri) return;
    setStatus('processing');
    setProtectedUri(null);

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        formData.append('file', blob, 'image.jpg');
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'image.jpg',
        } as any);
      }
      formData.append('intensity', String(noiseIntensity));

      const apiRes = await fetch(`${getApiBaseUrl()}/api/protect`, {
        method: 'POST',
        body: formData,
      });

      if (!apiRes.ok) {
        const text = await apiRes.text();
        throw new Error(`Server error ${apiRes.status}: ${text}`);
      }

      const data = await apiRes.json();
      setProtectedUri(`data:image/png;base64,${data.image}`);
      setStatus('completed');
    } catch (err: any) {
      console.error('[Shield] protect error:', err);
      setStatus('error');
      Alert.alert(
        'Protection failed',
        err.message ?? 'Could not reach the backend. Make sure it is running.',
      );
    }
  };

  const handleSaveToVault = async () => {
    if (!protectedUri) return;
    const now = new Date();
    const timestamp =
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const protectionLevel =
      noiseIntensity >= 70
        ? 'Max protection'
        : noiseIntensity >= 40
          ? 'High protection'
          : 'Medium protection';
    await addVaultItem({
      id: randomId(),
      label: `Photo ${Math.floor(Math.random() * 900 + 100)}`,
      timestamp,
      protectionLevel,
      noiseProfile: 'Gradient defense',
      previewColor: PREVIEW_COLORS[Math.floor(Math.random() * PREVIEW_COLORS.length)],
      imageData: protectedUri,
    });
    Alert.alert('Saved ✓', 'Protected image saved to Secure Vault.');
  };

  const handleDownload = () => {
    if (!protectedUri) return;
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = protectedUri;
      a.download = 'privashield_protected.png';
      a.click();
    } else {
      Alert.alert('Tip', 'Save to Vault first, then share from the Vault screen.');
    }
  };

  const statusLabel =
    status === 'processing'
      ? 'Applying adversarial gradient noise — please wait...'
      : status === 'completed'
        ? 'Image protected. Save to vault or download below.'
        : status === 'error'
          ? 'Protection failed. Is the backend running on port 8001?'
          : imageUri
            ? 'Image ready — tap Generate to apply adversarial noise.'
            : 'Upload an image and set noise level to begin.';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.topSection}>
          <Text style={styles.title}>Shield Hub</Text>
          <Text style={styles.subtitle}>Adversarial gradient-descent protection for your images.</Text>
        </View>

        {/* Upload zone */}
        <TouchableOpacity style={styles.uploadZone} onPress={handleUploadPress} activeOpacity={0.9}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadPreview} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.uploadIcon}>📁</Text>
              <Text style={styles.uploadTitle}>Tap to upload image</Text>
              <Text style={styles.uploadHint}>Select from gallery or camera</Text>
              <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
            </>
          )}
          {imageUri && (
            <View style={styles.uploadChangeTag}>
              <Text style={styles.uploadChangeText}>tap to change</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Noise slider */}
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
          <Text style={styles.sliderHint}>
            {noiseIntensity < 30
              ? 'Subtle — very low visual impact'
              : noiseIntensity < 60
                ? 'Balanced — invisible to humans, disrupts AI'
                : 'Aggressive — maximum AI resistance'}
          </Text>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            !imageUri || status === 'processing'
              ? styles.generateButtonDisabled
              : styles.generateButtonActive,
          ]}
          disabled={!imageUri || status === 'processing'}
          onPress={handleGenerate}
          activeOpacity={0.88}
        >
          <Text style={styles.generateButtonText}>
            {status === 'processing' ? '⏳ Generating...' : '⚡ Generate Protected Image'}
          </Text>
        </TouchableOpacity>

        {/* Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>
          <Text
            style={[
              styles.statusText,
              status === 'completed' && styles.statusGreen,
              status === 'error' && styles.statusRed,
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        {/* Result */}
        {protectedUri ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>🛡️ Protected Image</Text>
            <Image source={{ uri: protectedUri }} style={styles.resultImage} resizeMode="cover" />
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.resultButtonVault}
                onPress={handleSaveToVault}
                activeOpacity={0.85}
              >
                <Text style={styles.resultButtonTextDark}>Save to Vault 🔐</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resultButtonDownload}
                onPress={handleDownload}
                activeOpacity={0.85}
              >
                <Text style={styles.resultButtonTextLight}>Download ↓</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05060B',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
  },
  topSection: {
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9AA3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  uploadZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(14,246,255,0.28)',
    borderRadius: 24,
    backgroundColor: 'rgba(14,246,255,0.03)',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: 220,
    borderRadius: 22,
  },
  uploadChangeTag: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  uploadChangeText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  uploadHint: {
    color: '#9AA3B8',
    fontSize: 13,
  },
  shimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(14,246,255,0.10)',
  },
  sliderSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#0E111C',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.1)',
    gap: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  sliderHint: {
    color: '#9AA3B8',
    fontSize: 12,
    marginTop: 4,
  },
  generateButton: {
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonActive: {
    backgroundColor: '#0EF6FF',
  },
  generateButtonDisabled: {
    backgroundColor: 'rgba(14,246,255,0.15)',
  },
  generateButtonText: {
    color: '#05060B',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  statusText: {
    color: '#9AA3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  statusGreen: {
    color: '#3DFFA0',
  },
  statusRed: {
    color: '#FF6060',
  },
  resultSection: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.14)',
    overflow: 'hidden',
    gap: 0,
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    padding: 16,
    paddingBottom: 12,
  },
  resultImage: {
    width: '100%',
    height: 240,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  resultButtonVault: {
    flex: 1,
    backgroundColor: '#0EF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resultButtonDownload: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.35)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resultButtonTextDark: {
    color: '#05060B',
    fontWeight: '700',
    fontSize: 14,
  },
  resultButtonTextLight: {
    color: '#0EF6FF',
    fontWeight: '700',
    fontSize: 14,
  },
});
