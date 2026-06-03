import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type VaultItem = {
  id: string;
  label: string;
  timestamp: string;
  protectionLevel: string;
  noiseProfile: string;
  previewColor: string;
};

export function VaultCard({
  item,
  onPress,
}: {
  item: VaultItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.preview, { backgroundColor: item.previewColor }]} />
      <View style={styles.info}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.meta}>{item.protectionLevel}</Text>
        <Text style={styles.small}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    margin: 8,
    borderRadius: 20,
    backgroundColor: '#111218',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.12)',
    overflow: 'hidden',
  },
  preview: {
    height: 120,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  info: {
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  meta: {
    fontSize: 12,
    color: '#0EF6FF',
  },
  small: {
    marginTop: 6,
    fontSize: 12,
    color: '#9AA3B8',
  },
});
