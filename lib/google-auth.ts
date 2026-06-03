import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { getApiBaseUrl, GOOGLE_AUTH_ENDPOINT } from '@/constants/api';

export type BackendAuthUser = {
  sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

export type BackendAuthResponse = {
  status: string;
  user: BackendAuthUser;
  detail?: string;
  message?: string;
};

/** Verify Google id_token with FastAPI; throws on failure. */
export async function verifyGoogleIdTokenWithBackend(
  idToken: string,
): Promise<BackendAuthResponse> {
  const url = `${getApiBaseUrl()}${GOOGLE_AUTH_ENDPOINT}`;
  console.log('[Auth] Sending to Backend:', url);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
  } catch (networkError) {
    console.error('[Auth] Network error:', networkError);
    throw new Error(
      'Cannot reach the auth server. Start the backend (port 8000) and check the API URL in constants/api.ts.',
    );
  }

  console.log('[Auth] Backend HTTP status:', backendResponse.status);

  let backendData: BackendAuthResponse & { detail?: string };
  try {
    backendData = await backendResponse.json();
  } catch {
    throw new Error('Backend returned a non-JSON response. Is the server running?');
  }

  console.log('[Auth] Backend response body:', backendData);

  if (!backendResponse.ok || backendData.status !== 'success') {
    const detail = backendData.detail;
    throw new Error(
      (typeof detail === 'string' ? detail : undefined) ||
        backendData.message ||
        'Unable to verify Google login with backend.',
    );
  }

  console.log('[Auth] Backend Confirmed — authentication successful');
  return backendData;
}

/** Native Google Sign-In; returns id_token. */
export async function getGoogleIdTokenNative(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  console.log('[Auth] Google Sign-In response type:', response.type);

  if (isCancelledResponse(response)) {
    const err = new Error('Sign in cancelled') as Error & { code?: string };
    err.code = statusCodes.SIGN_IN_CANCELLED;
    throw err;
  }

  if (!isSuccessResponse(response)) {
    throw new Error('Unexpected Google sign-in response.');
  }

  let idToken = response.data.idToken;
  if (!idToken) {
    console.log('[Auth] idToken null on signIn response, calling getTokens()');
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }

  if (!idToken) {
    throw new Error('No ID Token received from Google.');
  }

  console.log('[Auth] Token Received (length:', idToken.length, ')');
  return idToken;
}
