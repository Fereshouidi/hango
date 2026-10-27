import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert as RNAlert, AlertButton, AlertOptions } from 'react-native';
import { AppBanner, BannerButton, BannerType } from '@/components/banners/AppBanner';

export interface ShowBannerOptions {
  type?: BannerType;
  position?: 'top' | 'center';
  title: string;
  subTitle?: string;
  message?: string;
  details?: string;
  buttons?: BannerButton[];
  autoCloseMs?: number;
  onClose?: () => void;
}

interface BannerContextValue {
  show: (options: ShowBannerOptions) => void;
  hide: () => void;
  success: (title: string, message?: string, options?: Partial<ShowBannerOptions>) => void;
  error: (title: string, message?: string, options?: Partial<ShowBannerOptions>) => void;
  warning: (title: string, message?: string, options?: Partial<ShowBannerOptions>) => void;
  info: (title: string, message?: string, options?: Partial<ShowBannerOptions>) => void;
}

const BannerContext = createContext<BannerContextValue | null>(null);

// Global listener for imperative triggers outside of React components
type GlobalBannerListener = (options: ShowBannerOptions) => void;
let globalListener: GlobalBannerListener | null = null;
let globalHideListener: (() => void) | null = null;

export const showBanner = (options: ShowBannerOptions) => {
  if (globalListener) {
    globalListener(options);
  }
};

export const hideBanner = () => {
  if (globalHideListener) {
    globalHideListener();
  }
};

export const showSuccess = (title: string, message?: string, options?: Partial<ShowBannerOptions>) => {
  showBanner({ type: 'success', title, message, ...options });
};

export const showError = (title: string, message?: string, options?: Partial<ShowBannerOptions>) => {
  showBanner({ type: 'error', title, message, ...options });
};

export const showWarning = (title: string, message?: string, options?: Partial<ShowBannerOptions>) => {
  showBanner({ type: 'warning', title, message, ...options });
};

export const showInfo = (title: string, message?: string, options?: Partial<ShowBannerOptions>) => {
  showBanner({ type: 'info', title, message, ...options });
};

/**
 * Intelligent helper to detect the appropriate banner type from native Alert arguments
 */
function inferBannerType(title?: string, message?: string, buttons?: AlertButton[]): BannerType {
  const t = (title || '').toLowerCase();
  const m = (message || '').toLowerCase();

  // If any button is destructive, it's a warning or error prompt
  if (buttons?.some((b) => b.style === 'destructive' || (b.text && b.text.toLowerCase().includes('delete')))) {
    return 'warning';
  }

  // Error signals
  if (
    t.includes('error') ||
    t.includes('failed') ||
    t.includes('fail') ||
    t.includes('could not save') ||
    m.includes('error') ||
    m.includes('failed') ||
    m.includes('could not') ||
    m.includes('cannot') ||
    m.includes('went wrong')
  ) {
    return 'error';
  }

  // Success signals
  if (
    t.includes('success') ||
    t.includes('welcome') ||
    t.includes('saved') ||
    t.includes('created') ||
    t.includes('updated') ||
    t.includes('restored') ||
    t.includes('approved') ||
    t.includes('unlocked') ||
    t.includes('congratulations')
  ) {
    return 'success';
  }

  // Warning signals
  if (
    t.includes('delete') ||
    t.includes('remove') ||
    t.includes('sign out') ||
    t.includes('logout') ||
    t.includes('warning') ||
    t.includes('missing') ||
    t.includes('validation') ||
    t.includes('clear') ||
    t.includes('required') ||
    m.includes('are you sure') ||
    m.includes('permanently')
  ) {
    return 'warning';
  }

  return 'info';
}

// Preserve original native alert if needed
export const nativeAlert = RNAlert.alert.bind(RNAlert);

/**
 * Automatically bridges React Native's Alert.alert to HanGo's rich AppBanner
 */
export function setupGlobalAlertBridge() {
  RNAlert.alert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: AlertOptions
  ) => {
    const type = inferBannerType(title, message, buttons);
    const convertedButtons: BannerButton[] = buttons && buttons.length > 0
      ? buttons.map((b) => ({
          text: b.text || 'Done',
          style: b.style as any,
          onPress: b.onPress,
        }))
      : [{ text: 'Done', style: 'default' }];

    const hasMultipleButtons = convertedButtons.length > 1;
    const isDestructive = convertedButtons.some(
      (b) =>
        b.style === 'destructive' ||
        b.text.toLowerCase() === 'delete' ||
        b.text.toLowerCase() === 'remove'
    );

    // If it is a prompt (e.g. Yes/No, Cancel/Delete, or destructive action), center it in the middle of the screen!
    const isCenter = hasMultipleButtons || isDestructive || type === 'warning';

    showBanner({
      type,
      position: isCenter ? 'center' : 'top',
      title: title || '',
      message: message || '',
      buttons: convertedButtons,
      autoCloseMs: hasMultipleButtons ? 0 : type === 'success' ? 3200 : 0,
    });
  };
}

export const BannerAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bannerState, setBannerState] = useState<ShowBannerOptions & { visible: boolean; id: number }>({
    visible: false,
    title: '',
    id: 0,
  });

  useEffect(() => {
    // Set global listeners
    globalListener = (options: ShowBannerOptions) => {
      setBannerState({
        ...options,
        visible: true,
        id: Date.now(),
      });
    };

    globalHideListener = () => {
      setBannerState((prev) => ({ ...prev, visible: false }));
    };

    // Install global Alert.alert bridge
    setupGlobalAlertBridge();

    return () => {
      globalListener = null;
      globalHideListener = null;
    };
  }, []);

  const show = (options: ShowBannerOptions) => {
    setBannerState({
      ...options,
      visible: true,
      id: Date.now(),
    });
  };

  const hide = () => {
    setBannerState((prev) => ({ ...prev, visible: false }));
  };

  const contextValue: BannerContextValue = {
    show,
    hide,
    success: (title, message, options) => show({ type: 'success', title, message, ...options }),
    error: (title, message, options) => show({ type: 'error', title, message, ...options }),
    warning: (title, message, options) => show({ type: 'warning', title, message, ...options }),
    info: (title, message, options) => show({ type: 'info', title, message, ...options }),
  };

  return (
    <BannerContext.Provider value={contextValue}>
      {children}
      <AppBanner
        key={bannerState.id}
        id={bannerState.id}
        visible={bannerState.visible}
        type={bannerState.type}
        position={bannerState.position}
        title={bannerState.title}
        subTitle={bannerState.subTitle}
        message={bannerState.message}
        details={bannerState.details}
        buttons={bannerState.buttons}
        autoCloseMs={bannerState.autoCloseMs}
        onClose={() => {
          setBannerState((prev) => ({ ...prev, visible: false }));
          if (bannerState.onClose) bannerState.onClose();
        }}
      />
    </BannerContext.Provider>
  );
};

export const useBannerAlert = () => {
  const ctx = useContext(BannerContext);
  if (!ctx) {
    // Return fallback using global functions if called outside provider
    return {
      show: showBanner,
      hide: hideBanner,
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
    };
  }
  return ctx;
};
