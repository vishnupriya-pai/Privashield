import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { VaultCard } from '@/components/ui/vault-card';
import { getVaultItems, removeVaultItem, type VaultItem } from '@/lib/vault-store';
import { useUser } from '@/lib/user-context';

export default function VaultScreen() {
  const { user } = useUser();
  const userId = user?.sub ?? 'guest';
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selected, setSelected] = useState<VaultItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      getVaultItems(userId).then((data) => {
        setItems(data);
        setSelected((prev) => (prev ? data.find((i) => i.id === prev.id) ?? null : null));
      });
    }, [userId]),
  );

  const handleDelete = async (id: string) => {
    const doRemove = async () => {
      await removeVaultItem(id, userId);
      const updated = await getVaultItems(userId);
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
      {selected ? (
        /* ── Full detail view ── */
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.detailBadge}>{selected.protectionLevel}</Text>
          </View>

          {selected.imageData ? (
            <Image
              source={{ uri: selected.imageData }}
              style={styles.detailImage}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.detailImage, { backgroundColor: selected.previewColor, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#9AA3B8', fontSize: 13 }}>Image not available</Text>
            </View>
          )}

          <View style={styles.detailMeta}>
            <Text style={styles.detailTitle}>{selected.label}</Text>
            <Text style={styles.detailSub}>Saved: {selected.timestamp}</Text>
            <Text style={styles.detailSub}>Noise profile: {selected.noiseProfile}</Text>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.btnDownload}
              activeOpacity={0.85}
              onPress={() => handleDownload(selected)}
            >
              <Text style={styles.btnDownloadText}>Download ↓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnDelete}
              activeOpacity={0.85}
              onPress={() => handleDelete(selected.id)}
            >
              <Text style={styles.btnDeleteText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* ── Grid view ── */
        <>
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#05060B', padding: 20 },

  /* Grid */
  headerSection: { marginBottom: 18 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 6, color: '#9AA3B8', fontSize: 14 },
  grid: { paddingVertical: 10 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  emptyHint: { color: '#9AA3B8', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },

  /* Detail view */
  detailScroll: { paddingBottom: 40 },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backText: { color: '#0EF6FF', fontSize: 15, fontWeight: '600' },
  detailBadge: { color: '#0EF6FF', fontSize: 12, fontWeight: '700' },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#111218',
    marginBottom: 20,
  },
  detailMeta: { gap: 6, marginBottom: 24 },
  detailTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  detailSub: { color: '#9AA3B8', fontSize: 13 },
  detailActions: { flexDirection: 'row', gap: 12 },
  btnDownload: {
    flex: 1,
    backgroundColor: '#0EF6FF',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDownloadText: { color: '#05060B', fontWeight: '700', fontSize: 15 },
  btnDelete: {
    flex: 1,
    backgroundColor: 'rgba(255,80,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDeleteText: { color: '#FF6060', fontWeight: '700', fontSize: 15 },
});
