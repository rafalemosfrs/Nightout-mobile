import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { registerClientRequest } from '../../services/api';

export default function RegisterClientScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [apelido, setApelido] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateEmail = (valor) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor);
  };

  const handleRegister = async () => {
  setApiError('');

  if (!nome.trim()) {
    setApiError('Informe seu nome completo.');
    return;
  }

  if (!email.trim() || !validateEmail(email)) {
    setApiError('Informe um email válido.');
    return;
  }

  if (!senha || senha.length < 6) {
    setApiError('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    setLoading(true);

    const data = await registerClientRequest({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      telefone: telefone.trim() || undefined,
      apelido: apelido.trim() || undefined,
      preferencias: preferencias.trim() || undefined,
      data_nascimento: dataNascimento.trim() || undefined,
    });

    Alert.alert('Sucesso', data.message || 'Cliente cadastrado com sucesso!');
    router.replace('/');
  } catch (error) {
    setApiError(error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={34} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Cadastrar Cliente</Text>

        <View style={styles.form}>
          <Input
            label="Nome Completo"
            placeholder="Nome completo"
            value={nome}
            onChangeText={(text) => {
              setNome(text);
              setApiError('');
            }}
          />

          <Input
            label="Email"
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setApiError('');
            }}
          />

          <Input
            label="Telefone"
            placeholder="+55 85 99999-9999"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={(text) => {
              setTelefone(text);
              setApiError('');
            }}
          />

          <Input
            label="Senha"
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={(text) => {
              setSenha(text);
              setApiError('');
            }}
          />

          <Input
            label="Apelido"
            placeholder="Como prefere ser chamado"
            value={apelido}
            onChangeText={(text) => {
              setApelido(text);
              setApiError('');
            }}
          />

          <Input
            label="Data de Nascimento"
            placeholder="2006-03-31"
            value={dataNascimento}
            onChangeText={(text) => {
              setDataNascimento(text);
              setApiError('');
            }}
          />

          <Input
            label="Preferências"
            placeholder="Estilos musicais, tipos de eventos, etc."
            value={preferencias}
            onChangeText={(text) => {
              setPreferencias(text);
              setApiError('');
            }}
          />
        </View>

        {apiError ? (
          <Text style={styles.apiErrorText}>{apiError}</Text>
        ) : null}

        <Button
          title="Criar Conta"
          onPress={handleRegister}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#031533',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  content: {
    paddingTop: 84,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 18,
  },
  submitButton: {
    marginTop: 36,
  },
  apiErrorText: {
    color: '#FF6B6B',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
});