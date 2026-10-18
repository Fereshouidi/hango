import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { getServerUrl } from './authSyncService';

export interface AppUpdate {
  id: string;
  version: string;
  buildNumber: number;
  title: string;
  description: string;
  releaseNotes: string[];
  downloadUrl: string;
  isMandatory: boolean;
  platform: string;
  releasedAt?: string;
}

export interface CheckUpdateResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion?: string;
  isMandatory?: boolean;
  update?: AppUpdate;
  message?: string;
}

const STORAGE_KEY_DISMISSED = 'hango_dismissed_update_v';

/**
 * Returns current installed app version from Expo config or fallback
 */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Checks backend server for available updates
 * @param isManual true if triggered by user tapping "Check for updates"
 */
export async function checkAppUpdate(isManual = false): Promise<CheckUpdateResult> {
  const currentVersion = getCurrentAppVersion();

  try {
    const baseUrl = await getServerUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const platform = Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web';
    const query = new URLSearchParams({
      version: currentVersion,
      platform,
    }).toString();

    const res = await fetch(`${baseUrl}/api/updates/check?${query}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        updateAvailable: false,
        currentVersion,
        message: 'Could not connect to update service.',
      };
    }

    const data: CheckUpdateResult = await res.json();

    if (!data.updateAvailable || !data.update) {
      return {
        updateAvailable: false,
        currentVersion,
        latestVersion: data.latestVersion || currentVersion,
        message: data.message || 'You are already running the latest version.',
      };
    }

    // If update is optional and this is an automatic background check,
    // verify if user previously dismissed this version
    if (!isManual && !data.isMandatory) {
      const dismissed = await AsyncStorage.getItem(`${STORAGE_KEY_DISMISSED}${data.update.version}`);
      if (dismissed === 'true') {
        return {
          updateAvailable: false,
          currentVersion,
          latestVersion: data.update.version,
          message: 'Update previously dismissed.',
        };
      }
    }

    return data;
  } catch (err: any) {
    console.log('[UpdateService] Check failed:', err.message);
    return {
      updateAvailable: false,
      currentVersion,
      message: err.message || 'Could not check for updates.',
    };
  }
}

/**
 * Dismiss an optional update so the user is not repeatedly prompted in the background
 */
export async function dismissUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_DISMISSED}${version}`, 'true');
  } catch (e) {
    // ignore
  }
}

/**
 * Reset dismissed updates history
 */
export async function resetDismissedUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${STORAGE_KEY_DISMISSED}${version}`);
  } catch (e) {
    // ignore
  }
}

/**
 * Open update download URL in browser or app store
 */
export async function openUpdateDownload(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch (err) {
    console.error('[UpdateService] Failed to open download URL:', err);
  }
}
