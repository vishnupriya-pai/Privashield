import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';

const ACCENT = '#0EF6FF';

function TabIcon({ symbol }: { symbol: string }) {
  return <Text style={{ fontSize: 18 }}>{symbol}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: '#808394',
        tabBarStyle: {
          backgroundColor: '#05060B',
          borderTopColor: '#11131F',
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, letterSpacing: 0.5 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shield Hub',
          tabBarIcon: () => <TabIcon symbol="🛡️" />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Secure Vault',
          tabBarIcon: () => <TabIcon symbol="🔐" />,
        }}
      />
      <Tabs.Screen
        name="lab"
        options={{
          title: 'Security Lab',
          tabBarIcon: () => <TabIcon symbol="🧪" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <TabIcon symbol="👤" />,
        }}
      />
    </Tabs>
  );
}
