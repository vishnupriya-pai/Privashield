import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { GOOGLE_WEB_CLIENT_ID } from '@/constants/api';
import { getGoogleIdTokenNative, verifyGoogleIdTokenWithBackend } from '@/lib/google-auth';

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('[Auth] Configuring native Google Sign-In');
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
  }, []);

  const onAuthSuccess = () => {
    console.log('[Auth] Navigating to main app');
    router.push('/home');
  };

  const handleGoogleSignIn = async () => {
    console.log('[Auth] Button Clicked (native)');

    try {
      const idToken = await getGoogleIdTokenNative();
      await verifyGoogleIdTokenWithBackend(idToken);
      onAuthSuccess();
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('[Auth] Google sign-in error:', error);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[Auth] User cancelled sign-in');
        return;
      }
      if (err.code === statusCodes.IN_PROGRESS) {
        console.log('[Auth] Sign-in already in progress');
        return;
      }
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services are not available or outdated.');
        return;
      }

      Alert.alert('Login Failed', err.message ?? 'An unknown error occurred.');
    }
  };

  const handleWebGoogleSignIn = async (credentialResponse: CredentialResponse) => {
    console.log('[Auth] Button Clicked (web OAuth)', credentialResponse);

    try {
      const idToken = credentialResponse.credential;
      if (!idToken) {
        throw new Error('No credential received from Google.');
      }

      console.log('[Auth] Token Received (web, length:', idToken.length, ')');
      await verifyGoogleIdTokenWithBackend(idToken);
      onAuthSuccess();
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[Auth] Web Google sign-in error:', error);
      Alert.alert('Login Failed', err.message ?? 'An unknown error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PrivaShield</Text>
        <Text style={styles.subtitle}>Protect your identity from AI manipulation</Text>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.webGoogleContainer}>
          <GoogleLogin
            clientId={GOOGLE_WEB_CLIENT_ID}
            onSuccess={handleWebGoogleSignIn}
            onError={() => {
              console.error('[Auth] GoogleLogin widget error');
              Alert.alert('Login Failed', 'Google sign-in could not be started.');
            }}
            useOneTap={false}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Image
            source={{
              uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
            }}
            style={styles.googleIcon}
          />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A73E8',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  webGoogleContainer: {
    width: '90%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '90%',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C4043',
  },
});
