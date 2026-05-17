import React, { useState } from 'react';
import { Alert, ScrollView, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [descricao, setDescricao] = useState('');
  const [preferencias, setPreferencias] = useState('');
  const [loading, setLoading] = useState(false);

  const [nomeError, setNomeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [telefoneError, setTelefoneError] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [nomeArtisticoError, setNomeArtisticoError] = useState('');
  const [generoMusicalError, setGeneroMusicalError] = useState('');
  const [cacheMinimoError, setCacheMinimoError] = useState('');
  const [descricaoError, setDescricaoError] = useState('');
  const [portfolioError, setPortfolioError] = useState('');
  const [apiError, setApiError] = useState('');

  const clearFieldErrors = () => {
    setNomeError('');
    setEmailError('');
    setTelefoneError('');
    setSenhaError('');
    setNomeArtisticoError('');
    setGeneroMusicalError('');
    setCacheMinimoError('');
    setDescricaoError('');
    setPortfolioError('');
  };

  const validateEmail = (valor) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor);
  };

  const validateTelefone = (valor) => {
    const digits = valor.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const validateCacheMinimo = (valor) => {
    return /^[0-9]+([.,][0-9]{1,2})?$/.test(valor.trim());
  };

  const validatePortfolio = (valor) => {
    if (!valor.trim()) return false;
    return valor.includes('http://') || valor.includes('https://');
  };

  const handleCreateAccount = async () => {
    clearFieldErrors();
    setApiError('');

    let hasError = false;

    if (!nomeCompleto.trim()) {
      setNomeError('Informe seu nome completo.');
      hasError = true;
    }

    if (!email.trim() || !validateEmail(email)) {
      setEmailError('Informe um email válido.');
      hasError = true;
    }

    if (!telefone.trim()) {
      setTelefoneError('Informe o telefone.');
      hasError = true;
    } else if (!validateTelefone(telefone)) {
      setTelefoneError('Informe um telefone válido com DDD.');
      hasError = true;
    }

    if (!senha || senha.length < 6) {
      setSenhaError('A senha deve ter pelo menos 6 caracteres.');
      hasError = true;
    }

    if (!nomeArtistico.trim()) {
      setNomeArtisticoError('Informe seu nome artístico.');
      hasError = true;
    }

    if (!generoMusical.trim()) {
      setGeneroMusicalError('Informe o gênero musical.');
      hasError = true;
    }

    if (!cacheMinimo.trim()) {
      setCacheMinimoError('Informe o cachê mínimo.');
      hasError = true;
    } else if (!validateCacheMinimo(cacheMinimo)) {
      setCacheMinimoError('Informe apenas números. Ex: 1500 ou 1500,50');
      hasError = true;
    }

    if (!descricao.trim()) {
      setDescricaoError('Informe uma descricao para o perfil artistico.');
      hasError = true;
    }

    if (!preferencias.trim()) {
      setPortfolioError('Informe o portfólio.');
      hasError = true;
    } else if (!validatePortfolio(preferencias)) {
      setPortfolioError('Informe uma URL válida começando com http:// ou https://');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const data = await registerArtistRequest({
        nome: nomeCompleto.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: telefone.trim(),
        nome_artista: nomeArtistico.trim(),
        genero_musical: generoMusical.trim(),
        cache_min: Number(cacheMinimo.replace(',', '.')),
        descricao: descricao.trim(),
        portifolio: preferencias.trim(),
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Cadastrar Artista</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.form}>
          <View>
            <Input
              label="Nome Completo"
              placeholder="Nome completo"
              value={nomeCompleto}
              onChangeText={(text) => {
                setNomeCompleto(text);
                setNomeError('');
                setApiError('');
              }}
            />
            {nomeError ? <Text style={styles.fieldErrorText}>{nomeError}</Text> : null}
          </View>

          <View>
            <Input
              label="Email"
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                setApiError('');
              }}
            />
            {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
          </View>

          <View>
            <Input
              label="Telefone"
              placeholder="+55 85 99999-9999"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={(text) => {
                setTelefone(text);
                setTelefoneError('');
                setApiError('');
              }}
            />
            {telefoneError ? <Text style={styles.fieldErrorText}>{telefoneError}</Text> : null}
          </View>

          <View>
            <Input
              label="Senha"
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={(text) => {
                setSenha(text);
                setSenhaError('');
                setApiError('');
              }}
            />
            {senhaError ? <Text style={styles.fieldErrorText}>{senhaError}</Text> : null}
          </View>

          <View>
            <Input
              label="Nome Artístico"
              placeholder="Nome artístico"
              value={nomeArtistico}
              onChangeText={(text) => {
                setNomeArtistico(text);
                setNomeArtisticoError('');
                setApiError('');
              }}
            />
            {nomeArtisticoError ? (
              <Text style={styles.fieldErrorText}>{nomeArtisticoError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Gênero Musical"
              placeholder="Ex: Forró, Funk, Sertanejo"
              value={generoMusical}
              onChangeText={(text) => {
                setGeneroMusical(text);
                setGeneroMusicalError('');
                setApiError('');
              }}
            />
            {generoMusicalError ? (
              <Text style={styles.fieldErrorText}>{generoMusicalError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Cachê Mínimo (R$)"
              placeholder="Ex: 1500"
              keyboardType="numeric"
              value={cacheMinimo}
              onChangeText={(text) => {
                setCacheMinimo(text);
                setCacheMinimoError('');
                setApiError('');
              }}
            />
            {cacheMinimoError ? (
              <Text style={styles.fieldErrorText}>{cacheMinimoError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Descricao"
              placeholder="Resumo do show, repertorio e formato"
              value={descricao}
              onChangeText={(text) => {
                setDescricao(text);
                setDescricaoError('');
                setApiError('');
              }}
            />
            {descricaoError ? (
              <Text style={styles.fieldErrorText}>{descricaoError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Portfólio"
              placeholder="https://..."
              value={preferencias}
              onChangeText={(text) => {
                setPreferencias(text);
                setPortfolioError('');
                setApiError('');
              }}
            />
            {portfolioError ? (
              <Text style={styles.fieldErrorText}>{portfolioError}</Text>
            ) : null}
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#031533',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  topBarTitle: {
    color: '#D1D5DB',
    fontSize: 28,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  form: {
    gap: 18,
  },
  submitButton: {
    marginTop: 36,
  },
  fieldErrorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  apiErrorText: {
    color: '#FF6B6B',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
});
