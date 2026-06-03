import React, { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VaultCard, type VaultItem } from '@/components/ui/vault-card';

const VAULT_HISTORY: VaultItem[] = [
  {
    id: '1',
    label: 'Portrait 01',
    timestamp: 'Today · 08:13 AM',
    protectionLevel: 'High protection',
    noiseProfile: 'Gaussian adversarial',
    previewColor: '#142D3B',
  },
  {
    id: '2',
    label: 'Travel Shot',
    timestamp: 'Yesterday · 03:42 PM',
    protectionLevel: 'Medium protection',
    noiseProfile: 'Edge perturbation',
    previewColor: '#1B263B',
  },
  {
    id: '3',
    label: 'Conference',
    timestamp: '2 days ago',
    protectionLevel: 'Max protection',
    noiseProfile: 'Frequency mask',
    previewColor: '#1C2A3F',
  },
  {
    id: '4',
    label: 'ID Scan',
    timestamp: '3 days ago',
    protectionLevel: 'High protection',
    noiseProfile: 'Gradient defense',
    previewColor: '#10202F',
  },
];

export default function VaultScreen() {
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(VAULT_HISTORY[0]);

  const storageSummary = useMemo(() => `${VAULT_HISTORY.length} encrypted items secured`, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Secure Vault</Text>
        <Text style={styles.subtitle}>{storageSummary}</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.grid}
        data={VAULT_HISTORY}
        renderItem={({ item }) => (
          <VaultCard item={item} onPress={() => setSelectedItem(item)} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
      />

      {selectedItem ? (
        <View style={styles.detailCard}>
          <View style={styles.detailLabelRow}>
            <Text style={styles.detailTitle}>{selectedItem.label}</Text>
            <Text style={styles.detailBadge}>{selectedItem.protectionLevel}</Text>
          </View>
          <Text style={styles.detailMeta}>Timestamp: {selectedItem.timestamp}</Text>
          <Text style={styles.detailMeta}>Noise type: {selectedItem.noiseProfile}</Text>
          <TouchableOpacity style={styles.detailButton} activeOpacity={0.85}>
            <Text style={styles.detailButtonText}>Share / Download</Text>
          </TouchableOpacity>
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
    marginTop: 8,
  },
  detailButton: {
    marginTop: 18,
    backgroundColor: '#0EF6FF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  detailButtonText: {
    color: '#05060B',
    fontWeight: '700',
  },
});
