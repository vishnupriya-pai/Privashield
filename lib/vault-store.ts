import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface VaultItem {
  id: string;
  label: string;
  timestamp: string;
  protectionLevel: string;
  noiseProfile: string;
  previewColor: string;
  imageData?: string; // present in memory, NOT stored in AsyncStorage
}

// ── IndexedDB (web) — stores large image blobs ────────────────────────────────
// AsyncStorage → localStorage → ~5 MB cap. IndexedDB → no practical limit.

const IDB_NAME = 'privashield_db';
const IDB_VER = 1;
const IDB_STORE = 'images';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | undefined> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── AES-GCM encryption (web, Web Crypto API) ──────────────────────────────────

const ALGO = { name: 'AES-GCM', length: 256 } as const;

function encKeyName(userId: string) {
  return `@privashield_vk_${userId}`;
}

async function getOrCreateKey(userId: string): Promise<CryptoKey> {
  const stored = localStorage.getItem(encKeyName(userId));
  if (stored) {
    try {
      return await crypto.subtle.importKey('jwk', JSON.parse(stored), ALGO, false, [
        'encrypt',
        'decrypt',
      ]);
    } catch {
      localStorage.removeItem(encKeyName(userId));
    }
  }
  const key = await crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt']);
  localStorage.setItem(encKeyName(userId), JSON.stringify(await crypto.subtle.exportKey('jwk', key)));
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

async function encryptData(plain: string, userId: string): Promise<string> {
  const key = await getOrCreateKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  return JSON.stringify({ iv: bytesToB64(iv), ct: bytesToB64(ct) });
}

async function decryptData(encrypted: string, userId: string): Promise<string | undefined> {
  try {
    const { iv: ivB64, ct: ctB64 } = JSON.parse(encrypted);
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

// ── Storage key helpers ────────────────────────────────────────────────────────

function metaKey(userId: string) {
  return `@privashield_meta_${userId}`;
}
function imgKey(userId: string, itemId: string) {
  return `img_${userId}_${itemId}`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getVaultItems(userId: string): Promise<VaultItem[]> {
  try {
    // ── Migrate old items saved under the legacy key format ──────────────────
    const legacyKey = `@privashield_vault_${userId}`;
    const legacyJson = await AsyncStorage.getItem(legacyKey);
    if (legacyJson) {
      const legacyItems: VaultItem[] = JSON.parse(legacyJson);
      // Re-save each old item through the new architecture, then clear the old key
      for (const item of legacyItems) {
        await addVaultItem(item, userId);
      }
      await AsyncStorage.removeItem(legacyKey);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const json = await AsyncStorage.getItem(metaKey(userId));
    const metas: VaultItem[] = json ? JSON.parse(json) : [];

    if (Platform.OS !== 'web') return metas;

    // Fetch image data from IndexedDB and decrypt
    return Promise.all(
      metas.map(async (item) => {
        const raw = await idbGet(imgKey(userId, item.id));
        if (!raw) return item;
        const imageData = await decryptData(raw, userId);
        return { ...item, imageData };
      }),
    );
  } catch {
    return [];
  }
}

export async function addVaultItem(item: VaultItem, userId: string): Promise<void> {
  // 1. Save image data to IndexedDB (encrypted), keep metadata small
  if (Platform.OS === 'web' && item.imageData) {
    const encrypted = await encryptData(item.imageData, userId);
    await idbSet(imgKey(userId, item.id), encrypted);
  }

  // 2. Save metadata (no imageData) to AsyncStorage
  const json = await AsyncStorage.getItem(metaKey(userId));
  const metas: VaultItem[] = json ? JSON.parse(json) : [];
  const { imageData: _drop, ...meta } = item; // strip imageData
  metas.unshift(meta);
  await AsyncStorage.setItem(metaKey(userId), JSON.stringify(metas));
}

export async function removeVaultItem(id: string, userId: string): Promise<void> {
  // Remove image from IndexedDB
  if (Platform.OS === 'web') {
    await idbDelete(imgKey(userId, id));
  }

  // Remove metadata from AsyncStorage
  const json = await AsyncStorage.getItem(metaKey(userId));
  const metas: VaultItem[] = json ? JSON.parse(json) : [];
  await AsyncStorage.setItem(metaKey(userId), JSON.stringify(metas.filter((i) => i.id !== id)));
}
