import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  extraScrollHeight?: number;
  keyboardVerticalOffset?: number;
  children?: React.ReactNode;
}

/**
 * A reliable, cross-platform ScrollView that automatically keeps focused TextInputs
 * visible above the software keyboard on both iOS and Android.
 */
export const KeyboardAwareScrollView = forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  (
    {
      extraScrollHeight = 80,
      keyboardVerticalOffset = Platform.OS === 'ios' ? 88 : 0,
      contentContainerStyle,
      children,
      ...scrollViewProps
    },
    ref
  ) => {
    const internalRef = useRef<ScrollView>(null);
    const scrollRef = (ref as React.RefObject<ScrollView>) || internalRef;
    const currentScrollY = useRef(0);
    const [keyboardSpace, setKeyboardSpace] = useState(0);
    const latestKeyboardScreenY = useRef<number | null>(null);

    const scrollToFocusedInput = useCallback(
      (overrideScreenY?: number) => {
        setTimeout(() => {
          try {
            const focusedInput = TextInput.State?.currentlyFocusedInput?.();
            if (
              !focusedInput ||
              typeof (focusedInput as any).measureInWindow !== 'function'
            ) {
              return;
            }

            (focusedInput as any).measureInWindow(
              (_x: number, y: number, _width: number, height: number) => {
                const inputBottom = y + height;
                const kbTop =
                  overrideScreenY ??
                  latestKeyboardScreenY.current ??
                  (Platform.OS === 'android' ? 600 : 500);

                const targetBottom = kbTop - extraScrollHeight;

                if (inputBottom > targetBottom) {
                  const delta = inputBottom - targetBottom;
                  scrollRef.current?.scrollTo({
                    y: currentScrollY.current + delta,
                    animated: true,
                  });
                }
              }
            );
          } catch {
            // Measure can fail silently if view unmounted
          }
        }, 100);
      },
      [extraScrollHeight, scrollRef]
    );

    useEffect(() => {
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
        const height = e.endCoordinates.height;
        const screenY = e.endCoordinates.screenY;
        latestKeyboardScreenY.current = screenY;
        setKeyboardSpace(height);
        scrollToFocusedInput(screenY);
      });

      const hideSub = Keyboard.addListener(hideEvent, () => {
        latestKeyboardScreenY.current = null;
        setKeyboardSpace(0);
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, [scrollToFocusedInput]);

    return (
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={[
            contentContainerStyle,
            { paddingBottom: Math.max(100, keyboardSpace + 60) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            currentScrollY.current = e.nativeEvent.contentOffset.y;
            scrollViewProps.onScroll?.(e);
          }}
          scrollEventThrottle={16}
          onTouchEnd={() => {
            // When user taps between inputs while keyboard is open, scroll to the newly focused one
            if (keyboardSpace > 0) {
              scrollToFocusedInput();
            }
          }}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});

export default KeyboardAwareScrollView;
