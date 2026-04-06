import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Input({
  label,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  value,
  onChangeText,
}) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#7C8395"
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
        />

        {secureTextEntry ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsSecure(!isSecure)}>
            <Ionicons name={isSecure ? "eye-outline" : "eye-off-outline"} size={20} color="#7C8395" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 1,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#3B455A',
    borderRadius: 10,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
});