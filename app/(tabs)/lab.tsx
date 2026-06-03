import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function LabScreen() {
  const [metadataScrub, setMetadataScrub] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [batchMode, setBatchMode] = useState(true);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Security Lab</Text>
          <Text style={styles.subtitle}>Run advanced scans and configure your protection stack.</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={[styles.metricCard, styles.metricCardAccent]}>
            <Text style={styles.metricLabel}>Scan health</Text>
            <Text style={styles.metricValue}>98%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Batch jobs</Text>
            <Text style={styles.metricValue}>4 queued</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Protection tools</Text>
          <Text style={styles.panelText}>Enable or disable automated safeguards for future uploads.</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Automatic scan</Text>
            <Switch value={autoScan} onValueChange={setAutoScan} thumbColor={autoScan ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Metadata scrub</Text>
            <Switch value={metadataScrub} onValueChange={setMetadataScrub} thumbColor={metadataScrub ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Batch mode</Text>
            <Switch value={batchMode} onValueChange={setBatchMode} thumbColor={batchMode ? '#0EF6FF' : '#283041'} trackColor={{ false: '#191C28', true: '#0EF6FF' }} />
          </View>
        </View>

        <View style={styles.panel}> 
          <Text style={styles.panelTitle}>Quick actions</Text>
          <TouchableOpacity style={styles.quickButton} activeOpacity={0.9}>
            <Text style={styles.quickButtonText}>Run vulnerability scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} activeOpacity={0.9}>
            <Text style={styles.quickButtonText}>Batch protect all</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#05060B',
  },
  container: {
    padding: 20,
    gap: 18,
  },
  headerSection: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subtitle: {
    color: '#9AA3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#0B101D',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricCardAccent: {
    borderColor: '#0EF6FF',
  },
  metricLabel: {
    color: '#9AA3B8',
    fontSize: 13,
    marginBottom: 12,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  panel: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.08)',
    padding: 18,
    gap: 16,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  panelText: {
    color: '#9AA3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  panelLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0EF6FF',
  },
  quickButtonText: {
    color: '#05060B',
    fontWeight: '800',
    fontSize: 14,
  },
});
