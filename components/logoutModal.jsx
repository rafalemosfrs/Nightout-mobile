import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';

export default function LogoutModal({
  visible,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Sair da conta</Text>
          <Text style={styles.message}>
            Tem certeza que deseja sair?
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.buttonCancel,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
            >
              <Text style={styles.textCancel}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.buttonConfirm,
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.textConfirm}>Sair</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: '85%',
    backgroundColor: '#0f1f3d',
    borderRadius: 16,
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },

  message: {
    color: '#cbd5e1',
    marginBottom: 20,
    fontSize: 15,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  buttonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#334155',
    alignItems: 'center',
  },

  buttonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ff3b3b',
    alignItems: 'center',
  },

  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },

  textCancel: {
    color: '#e2e8f0',
    fontWeight: '500',
  },

  textConfirm: {
    color: '#fff',
    fontWeight: '600',
  },
});