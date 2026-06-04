import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_KEY = '@privashield_vault';

export interface VaultItem {
  id: string;
  label: string;
  timestamp: string;
  protectionLevel: string;
  noiseProfile: string;
  previewColor: string;
  imageData?: string;
}

export async function getVaultItems(): Promise<VaultItem[]> {
  try {
    const json = await AsyncStorage.getItem(VAULT_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addVaultItem(item: VaultItem): Promise<void> {
  const items = await getVaultItems();
  items.unshift(item);
  await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(items));
}

export async function removeVaultItem(id: string): Promise<void> {
  const items = await getVaultItems();
  const filtered = items.filter((i) => i.id !== id);
  await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
}
