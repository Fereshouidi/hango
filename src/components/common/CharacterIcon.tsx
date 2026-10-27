import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

export interface CharacterIconProps {
  size?: number;
  color?: string;
  char?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Renders a crisp, authentic Chinese Character (Hanzi) icon (defaults to '字' = Character).
 * Designed to be a drop-in replacement for vector icons with matching size & color props.
 */
export const CharacterIcon: React.FC<CharacterIconProps> = ({
  size = 20,
  color = '#ec489a',
  char = '字',
  style,
  textStyle,
}) => {
  const fontSize = Math.round(size * 0.9);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.glyph,
          {
            fontSize,
            color,
            lineHeight: size,
          },
          textStyle,
        ]}
        allowFontScaling={false}
      >
        {char}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default CharacterIcon;
