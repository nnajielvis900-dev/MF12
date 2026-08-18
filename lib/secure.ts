import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure key-value storage for session tokens.
 * Native: hardware-backed SecureStore (Keychain / Keystore).
 * Web preview: falls back to AsyncStorage.
 */
const isWeb = Platform.OS === 'web';

export const secureStore = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) return await AsyncStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      // non-fatal
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // non-fatal
    }
  },
};
