import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const VAULT_KEY = '@privashield_vault';
const VAULT_KEY_STORE = '@privashield_vk';

export interface VaultItem {
  id: string;
  label: string;
  timestamp: string;
  protectionLevel: string;
  noiseProfile: string;
  previewColor: string;
  imageData?: string;
}

// ── AES-GCM encryption (web only, uses built-in Web Crypto API) ───────────────

const CRYPTO_ALGO = { name: 'AES-GCM', length: 256 } as const;

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(VAULT_KEY_STORE);
  if (stored) {
    try {
      const jwk: JsonWebKey = JSON.parse(stored);
      return crypto.subtle.importKey('jwk', jwk, CRYPTO_ALGO, false, ['encrypt', 'decrypt']);
    } catch {
      localStorage.removeItem(VAULT_KEY_STORE);
    }
  }
  const key = await crypto.subtle.generateKey(CRYPTO_ALGO, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(VAULT_KEY_STORE, JSON.stringify(jwk));
  return key;
}

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
function bytesToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function encryptField(plain: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return JSON.stringify({ iv: bytesToB64(iv), ct: bytesToB64(ciphertext) });
}

async function decryptField(encrypted: string): Promise<string | undefined> {
  try {
    const { iv: ivB64, ct: ctB64 } = JSON.parse(encrypted) as { iv: string; ct: string };
    const key = await getOrCreateKey();
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(ivB64) },
      key,
      b64ToBytes(ctB64),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return undefined;
  }
}

function isEncrypted(value: string): boolean {
  return value.startsWith('{"iv":');
}

async function encryptItem(item: VaultItem): Promise<VaultItem> {
  if (Platform.OS !== 'web' || !item.imageData) return item;
  return { ...item, imageData: await encryptField(item.imageData) };
}

async function decryptItem(item: VaultItem): Promise<VaultItem> {
  if (Platform.OS !== 'web' || !item.imageData || !isEncrypted(item.imageData)) return item;
  const decrypted = await decryptField(item.imageData);
  return { ...item, imageData: decrypted };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getVaultItems(): Promise<VaultItem[]> {
  try {
    const json = await AsyncStorage.getItem(VAULT_KEY);
    if (!json) return [];
    const raw: VaultItem[] = JSON.parse(json);
    return Promise.all(raw.map(decryptItem));
  } catch {
    return [];
  }
}

export async function addVaultItem(item: VaultItem): Promise<void> {
  const raw = await getRawVaultItems();
  const encrypted = await encryptItem(item);
  raw.unshift(encrypted);
  await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(raw));
}

export async function removeVaultItem(id: string): Promise<void> {
  const raw = await getRawVaultItems();
  const filtered = raw.filter((i) => i.id !== id);
  await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
}

async function getRawVaultItems(): Promise<VaultItem[]> {
  try {
    const json = await AsyncStorage.getItem(VAULT_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}
