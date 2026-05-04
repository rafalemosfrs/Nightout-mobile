import React, { useState } from 'react';
import { Alert, ScrollView, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const [nomeError, setNomeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [telefoneError, setTelefoneError] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [apelidoError, setApelidoError] = useState('');
  const [dataNascimentoError, setDataNascimentoError] = useState('');
  const [preferenciasError, setPreferenciasError] = useState('');
  const [apiError, setApiError] = useState('');

  const clearFieldErrors = () => {
    setNomeError('');
    setEmailError('');
    setTelefoneError('');
    setSenhaError('');
    setApelidoError('');
    setDataNascimentoError('');
    setPreferenciasError('');
  };

  const validateEmail = (valor) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(valor);
  };

  const validateTelefone = (valor) => {
    const digits = valor.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const validateDataNascimento = (valor) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(valor.trim())) return false;

    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    return (
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia
    );
  };

  const handleRegister = async () => {
    clearFieldErrors();
    setApiError('');

    let hasError = false;

    if (!nome.trim()) {
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

    if (!apelido.trim()) {
      setApelidoError('Informe um apelido.');
      hasError = true;
    }

    if (dataNascimento.trim() && !validateDataNascimento(dataNascimento)) {
      setDataNascimentoError('Use o formato YYYY-MM-DD.');
      hasError = true;
    }

    if (!preferencias.trim()) {
      setPreferenciasError('Informe suas preferências.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: telefone.trim(),
        apelido: apelido.trim(),
        preferencias: preferencias.trim(),
      };

      if (dataNascimento.trim()) {
        payload.data_nascimento = dataNascimento.trim();
      }

      const data = await registerClientRequest(payload);

      Alert.alert('Sucesso', data.message || 'Cliente cadastrado com sucesso!');
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

          <Text style={styles.topBarTitle}>Cadastrar Cliente</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.form}>
          <View>
            <Input
              label="Nome Completo"
              placeholder="Nome completo"
              value={nome}
              onChangeText={(text) => {
                setNome(text);
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
              label="Apelido"
              placeholder="Como prefere ser chamado"
              value={apelido}
              onChangeText={(text) => {
                setApelido(text);
                setApelidoError('');
                setApiError('');
              }}
            />
            {apelidoError ? <Text style={styles.fieldErrorText}>{apelidoError}</Text> : null}
          </View>

          <View>
            <Input
              label="Data de Nascimento"
              placeholder="2006-03-31"
              value={dataNascimento}
              onChangeText={(text) => {
                setDataNascimento(text);
                setDataNascimentoError('');
                setApiError('');
              }}
            />
            {dataNascimentoError ? (
              <Text style={styles.fieldErrorText}>{dataNascimentoError}</Text>
            ) : null}
          </View>

          <View>
            <Input
              label="Preferências"
              placeholder="Estilos musicais, tipos de eventos, etc."
              value={preferencias}
              onChangeText={(text) => {
                setPreferencias(text);
                setPreferenciasError('');
                setApiError('');
              }}
            />
            {preferenciasError ? (
              <Text style={styles.fieldErrorText}>{preferenciasError}</Text>
            ) : null}
          </View>
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
    color: '#FFFFFF',
    fontSize: 22,
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