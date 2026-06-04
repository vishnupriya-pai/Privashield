import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { VaultCard } from '@/components/ui/vault-card';
import { getVaultItems, removeVaultItem, type VaultItem } from '@/lib/vault-store';

export default function VaultScreen() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      getVaultItems().then((data) => {
        setItems(data);
        setSelected((prev) => (prev ? data.find((i) => i.id === prev.id) ?? null : null));
      });
    }, []),
  );

  const handleDelete = async (id: string) => {
    const doRemove = async () => {
      await removeVaultItem(id);
      const updated = await getVaultItems();
      setItems(updated);
      if (selected?.id === id) setSelected(null);
    };

    if (Platform.OS === 'web') {
      await doRemove();
    } else {
      Alert.alert('Remove', 'Remove this image from the vault?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ]);
    }
  };

  const handleDownload = (item: VaultItem) => {
    if (!item.imageData) return;
    if (Platform.OS === 'web') {
      const a = document.createElement('a');
      a.href = item.imageData;
      a.download = `privashield_${item.label.replace(/\s+/g, '_')}.png`;
      a.click();
    } else {
      Alert.alert('Download', 'Open on web to download the image file.');
    }
  };

  const storageSummary =
    items.length === 0
      ? 'Vault is empty — protect an image in Shield Hub'
      : `${items.length} protected image${items.length !== 1 ? 's' : ''} secured`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Secure Vault</Text>
        <Text style={styles.subtitle}>{storageSummary}</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyText}>No protected images yet.</Text>
          <Text style={styles.emptyHint}>Head to Shield Hub to generate your first one.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.grid}
          data={items}
          renderItem={({ item }) => (
            <VaultCard item={item} onPress={() => setSelected(item)} />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selected ? (
        <View style={styles.detailCard}>
          <View style={styles.detailLabelRow}>
            <Text style={styles.detailTitle}>{selected.label}</Text>
            <Text style={styles.detailBadge}>{selected.protectionLevel}</Text>
          </View>
          <Text style={styles.detailMeta}>Saved: {selected.timestamp}</Text>
          <Text style={styles.detailMeta}>Noise: {selected.noiseProfile}</Text>
          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.detailButtonDownload}
              activeOpacity={0.85}
              onPress={() => handleDownload(selected)}
            >
              <Text style={styles.detailButtonTextDark}>Download ↓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailButtonDelete}
              activeOpacity={0.85}
              onPress={() => handleDelete(selected.id)}
            >
              <Text style={styles.detailButtonTextLight}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05060B',
    padding: 20,
  },
  headerSection: {
    marginBottom: 18,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: '#9AA3B8',
    fontSize: 14,
  },
  grid: {
    paddingVertical: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyHint: {
    color: '#9AA3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  detailCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#0E111C',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.1)',
  },
  detailLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  detailBadge: {
    color: '#0EF6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailMeta: {
    color: '#9AA3B8',
    fontSize: 13,
    marginTop: 6,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  detailButtonDownload: {
    flex: 1,
    backgroundColor: '#0EF6FF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  detailButtonDelete: {
    flex: 1,
    backgroundColor: 'rgba(255,80,80,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  detailButtonTextDark: {
    color: '#05060B',
    fontWeight: '700',
    fontSize: 14,
  },
  detailButtonTextLight: {
    color: '#FF6060',
    fontWeight: '700',
    fontSize: 14,
  },
});
