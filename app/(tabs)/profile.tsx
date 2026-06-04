import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useUser } from '@/lib/user-context';

function Avatar({ user }: { user: { name: string; picture?: string } }) {
  const [imgError, setImgError] = useState(false);
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (user.picture && !imgError) {
    return (
      <Image
        source={{ uri: user.picture }}
        style={styles.avatar}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useUser();
  const [biometric, setBiometric] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>Account</Text>
          <View style={styles.accountRow}>
            {user && <Avatar user={user} />}
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{user?.name ?? 'Guest'}</Text>
              <Text style={styles.accountEmail}>{user?.email ?? '—'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  screen: { flex: 1, backgroundColor: '#05060B' },
  container: { padding: 20, gap: 18 },
  accountCard: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.08)',
    gap: 14,
  },
  accountLabel: { color: '#0EF6FF', fontSize: 12, fontWeight: '700' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: '#1A2940',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#0EF6FF', fontSize: 20, fontWeight: '800' },
  accountInfo: { flex: 1 },
  accountName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  accountEmail: { marginTop: 3, color: '#9AA3B8', fontSize: 13 },
  signOutBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(255,80,80,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: { color: '#FF6060', fontWeight: '700', fontSize: 14 },
  panel: {
    borderRadius: 24,
    backgroundColor: '#090B13',
    borderWidth: 1,
    borderColor: 'rgba(14,246,255,0.08)',
    padding: 18,
    gap: 14,
  },
  panelTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  panelText: { color: '#9AA3B8', fontSize: 13, lineHeight: 20 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },
  optionButton: {
    borderRadius: 16,
    backgroundColor: '#0EF6FF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionText: { color: '#05060B', fontWeight: '700', fontSize: 14 },
});
