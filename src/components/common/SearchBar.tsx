import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search items...',
  onClear,
}) => {
  return (
    <View style={styles.container}>
      <Lucide name="search" size={16} color="#94a3b8" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
        >
          <Lucide name="x" size={16} color="#94a3b8" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
    flex: 1,
  },
  input: {
    height: 26,
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
});
