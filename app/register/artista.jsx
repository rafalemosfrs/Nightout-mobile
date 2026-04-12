import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { registerArtistRequest } from '../../services/api';

export default function RegisterArtistScreen() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [generoMusical, setGeneroMusical] = useState('');
  const [cacheMinimo, setCacheMinimo] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateEmail = (valor) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor);
  };

  const handleCreateAccount = async () => {
    setApiError('');

    if (!nomeCompleto.trim()) {
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

    if (!nomeArtistico.trim()) {
      setApiError('Informe seu nome artístico.');
      return;
    }

    if (!generoMusical.trim()) {
      setApiError('Informe o gênero musical.');
      return;
    }

    if (!cacheMinimo.trim()) {
      setApiError('Informe o cachê mínimo.');
      return;
    }

    try {
      setLoading(true);

      const data = await registerArtistRequest({
      nome: nomeCompleto.trim(),
      email: email.trim().toLowerCase(),
      senha,
      telefone: telefone.trim() || undefined,
      nome_artista: nomeArtistico.trim(),
      genero_musical: generoMusical.trim(),
      cache_min: cacheMinimo.trim(),
      portifolio: preferencias.trim() || undefined,
    });

      Alert.alert('Sucesso', data.message || 'Artista cadastrado com sucesso!');
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Cadastrar Artista</Text>

        <View style={styles.form}>
          <Input
            label="Nome Completo"
            placeholder="Nome completo"
            value={nomeCompleto}
            onChangeText={(text) => {
              setNomeCompleto(text);
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
            label="Nome Artístico"
            placeholder="Nome artístico"
            value={nomeArtistico}
            onChangeText={(text) => {
              setNomeArtistico(text);
              setApiError('');
            }}
          />

          <Input
            label="Gênero Musical"
            placeholder="Ex: Forró, Funk, Sertanejo"
            value={generoMusical}
            onChangeText={(text) => {
              setGeneroMusical(text);
              setApiError('');
            }}
          />

          <Input
            label="Cachê Mínimo (R$)"
            placeholder="Ex: 1500"
            keyboardType="numeric"
            value={cacheMinimo}
            onChangeText={(text) => {
              setCacheMinimo(text);
              setApiError('');
            }}
          />

          <Input
            label="Portfólio"
            placeholder="https://..."
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
          onPress={handleCreateAccount}
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
    paddingHorizontal: 22,
    paddingBottom: 40,
  },
  title: {
    color: '#D1D5DB',
    fontSize: 28,
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