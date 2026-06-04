import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';
import { Platform } from 'react-native';

import { UserProvider } from '@/lib/user-context';

const GOOGLE_WEB_CLIENT_ID =
  '1077337845085-rjlu5q5jlou94s8hmlc41csm3k2e7pqs.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
        <UserProvider>{children}</UserProvider>
      </GoogleOAuthProvider>
    );
  }
  return <UserProvider>{children}</UserProvider>;
}
