import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [biometric, setBiometric] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Account</Text>
          <Text style={styles.accountName}>Jane Doe</Text>
          <Text style={styles.accountEmail}>jane.doe@example.com</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Preferences</Text>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Biometric unlock</Text>
            <Switch
              value={biometric}
              onValueChange={setBiometric}
              thumbColor={biometric ? '#0EF6FF' : '#283041'}
              trackColor={{ false: '#191C28', true: '#0EF6FF' }}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.panelLabel}>Private browsing mode</Text>
            <Switch
              value={privacyMode}
              onValueChange={setPrivacyMode}
              thumbColor={privacyMode ? '#0EF6FF' : '#283041'}
              trackColor={{ false: '#191C28', true: '#0EF6FF' }}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Security</Text>
          <TouchableOpacity style={styles.optionButton} activeOpacity={0.9}>
            <Text style={styles.optionText}>Change passcode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} activeOpacity={0.9}>
            <Text style={styles.optionText}>Manage connected devices</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}> 
          <Text style={styles.panelTitle}>App</Text>
          <Text style={styles.panelText}>PrivaShield 1.0.0 • Safe by default</Text>
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
  accountCard: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.08)',
  },
  accountLabel: {
    color: '#0EF6FF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  accountEmail: {
    marginTop: 4,
    color: '#9AA3B8',
    fontSize: 13,
  },
  panel: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.08)',
    padding: 18,
    gap: 14,
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
  },
  panelLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  optionButton: {
    borderRadius: 16,
    backgroundColor: '#0EF6FF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionText: {
    color: '#05060B',
    fontWeight: '700',
    fontSize: 14,
  },
});
