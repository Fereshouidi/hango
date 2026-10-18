import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import {
  AppUpdate,
  checkAppUpdate,
  CheckUpdateResult,
  dismissUpdate,
  getCurrentAppVersion,
  openUpdateDownload,
} from '@/services/updateService';
import { UpdateModal } from '@/components/update-modal';

interface UpdateContextType {
  checking: boolean;
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  update: AppUpdate | null;
  checkForUpdates: (manual?: boolean) => Promise<CheckUpdateResult>;
  dismissCurrentUpdate: () => Promise<void>;
  openCurrentUpdateDownload: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType>({
  checking: false,
  updateAvailable: false,
  currentVersion: '1.0.0',
  latestVersion: '1.0.0',
  update: null,
  checkForUpdates: async () => ({ updateAvailable: false, currentVersion: '1.0.0' }),
  dismissCurrentUpdate: async () => {},
  openCurrentUpdateDownload: async () => {},
});

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState(getCurrentAppVersion());

  const currentVersion = getCurrentAppVersion();
  const lastCheckTime = useRef<number>(0);

  const checkForUpdates = useCallback(
    async (manual = false): Promise<CheckUpdateResult> => {
      setChecking(true);
      try {
        const result = await checkAppUpdate(manual);
        lastCheckTime.current = Date.now();

        if (result.latestVersion) {
          setLatestVersion(result.latestVersion);
        }

        if (result.updateAvailable && result.update) {
          setUpdateAvailable(true);
          setUpdate(result.update);
          setModalVisible(true);
        } else {
          setUpdateAvailable(false);
          if (manual) {
            Alert.alert(
              'Up to Date!',
              `You are already using the latest version of HanGo (v${currentVersion}).`
            );
          }
        }
        return result;
      } finally {
        setChecking(false);
      }
    },
    [currentVersion]
  );

  const dismissCurrentUpdate = useCallback(async () => {
    if (update) {
      await dismissUpdate(update.version);
    }
    setModalVisible(false);
  }, [update]);

  const openCurrentUpdateDownload = useCallback(async () => {
    if (update?.downloadUrl) {
      await openUpdateDownload(update.downloadUrl);
    }
  }, [update]);

  // Initial silent check on launch (delayed slightly for smooth app startup)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  // Periodic check when app returns to foreground (at most once every 15 minutes)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const now = Date.now();
        if (now - lastCheckTime.current > 15 * 60 * 1000) {
          checkForUpdates(false);
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [checkForUpdates]);

  return (
    <UpdateContext.Provider
      value={{
        checking,
        updateAvailable,
        currentVersion,
        latestVersion,
        update,
        checkForUpdates,
        dismissCurrentUpdate,
        openCurrentUpdateDownload,
      }}
    >
      {children}

      <UpdateModal
        visible={modalVisible}
        update={update}
        currentVersion={currentVersion}
        onDismiss={dismissCurrentUpdate}
      />
    </UpdateContext.Provider>
  );
}

export function useAppUpdates() {
  return useContext(UpdateContext);
}
