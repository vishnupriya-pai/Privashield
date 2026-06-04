import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AppUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface UserContextValue {
  user: AppUser | null;
  loading: boolean;
  setUser: (u: AppUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const USER_KEY = '@privashield_user';

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  setUser: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY)
      .then((json) => {
        if (json) setUserState(JSON.parse(json));
      })
      .finally(() => setLoading(false));
  }, []);

  const setUser = useCallback(async (u: AppUser) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUserState(u);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUserState(null);
    router.replace('/login');
  }, [router]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

/** Decode the payload of a JWT without verifying the signature. */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}
