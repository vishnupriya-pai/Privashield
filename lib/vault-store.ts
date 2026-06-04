import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface VaultItem {
  id: string;
  label: string;
  timestamp: string;
  protectionLevel: string;
  noiseProfile: string;
  previewColor: string;
  imageData?: string;
}

// ── Key helpers (namespaced per user) ─────────────────────────────────────────

function vaultStorageKey(userId: string) {
  return `@privashield_vault_${userId}`;
}
function vaultEncryptionKey(userId: string) {
  return `@privashield_vk_${userId}`;
}

// ── AES-GCM encryption (web, built-in Web Crypto API) ────────────────────────

const ALGO = { name: 'AES-GCM', length: 256 } as const;

async function getOrCreateKey(userId: string): Promise<CryptoKey> {
  const storeKey = vaultEncryptionKey(userId);
  const stored = localStorage.getItem(storeKey);
  if (stored) {
    try {
      const jwk: JsonWebKey = JSON.parse(stored);
      return crypto.subtle.importKey('jwk', jwk, ALGO, false, ['encrypt', 'decrypt']);
    } catch {
      localStorage.removeItem(storeKey);
    }
  }
  const key = await crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(storeKey, JSON.stringify(jwk));
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

async function encryptField(plain: string, userId: string): Promise<string> {
  const key = await getOrCreateKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return JSON.stringify({ iv: bytesToB64(iv), ct: bytesToB64(ciphertext) });
}

async function decryptField(encrypted: string, userId: string): Promise<string | undefined> {
  try {
    const { iv: ivB64, ct: ctB64 } = JSON.parse(encrypted) as { iv: string; ct: string };
    const key = await getOrCreateKey(userId);
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

async function encryptItem(item: VaultItem, userId: string): Promise<VaultItem> {
  if (Platform.OS !== 'web' || !item.imageData) return item;
  return { ...item, imageData: await encryptField(item.imageData, userId) };
}

async function decryptItem(item: VaultItem, userId: string): Promise<VaultItem> {
  if (Platform.OS !== 'web' || !item.imageData || !isEncrypted(item.imageData)) return item;
  const decrypted = await decryptField(item.imageData, userId);
  return { ...item, imageData: decrypted };
}

// ── Public API (all functions require userId) ─────────────────────────────────

export async function getVaultItems(userId: string): Promise<VaultItem[]> {
  try {
    const json = await AsyncStorage.getItem(vaultStorageKey(userId));
    if (!json) return [];
    const raw: VaultItem[] = JSON.parse(json);
    return Promise.all(raw.map((item) => decryptItem(item, userId)));
  } catch {
    return [];
  }
}

export async function addVaultItem(item: VaultItem, userId: string): Promise<void> {
  const raw = await getRawItems(userId);
  const encrypted = await encryptItem(item, userId);
  raw.unshift(encrypted);
  await AsyncStorage.setItem(vaultStorageKey(userId), JSON.stringify(raw));
}

export async function removeVaultItem(id: string, userId: string): Promise<void> {
  const raw = await getRawItems(userId);
  const filtered = raw.filter((i) => i.id !== id);
  await AsyncStorage.setItem(vaultStorageKey(userId), JSON.stringify(filtered));
}

async function getRawItems(userId: string): Promise<VaultItem[]> {
  try {
    const json = await AsyncStorage.getItem(vaultStorageKey(userId));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}
