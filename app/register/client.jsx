import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { registerClientRequest } from '../../services/api';

const CLIENT_GENRES = [
  { label: 'Forró', value: 'forro' },
  { label: 'Trap', value: 'trap' },
  { label: 'Funk', value: 'funk' },
  { label: 'Sertanejo', value: 'sertanejo' },
  { label: 'Outros', value: 'outros' },
];

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePhone(value) {
  const digits = onlyDigits(value);

  if (!digits) return value.trim();
  if (digits.startsWith('55')) return `+${digits}`;

  return `+55${digits}`;
}

function formatDateNascimento(value) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function convertBrazilianDateToIso(value) {
  const [dia, mes, ano] = value.split('/');
  return new Date(`${ano}-${mes}-${dia}T00:00:00.000Z`).toISOString();
}

export default function RegisterClientScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [apelido, setApelido] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
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
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(valor.trim())) return false;

    const [dia, mes, ano] = valor.split('/').map(Number);
    const data = new Date(ano, mes - 1, dia);

    return (
      data.getFullYear() === ano &&
      data.getMonth() === mes - 1 &&
      data.getDate() === dia
    );
  };

  function toggleGenre(value) {
    setSelectedGenres((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
    setPreferenciasError('');
    setApiError('');
  }

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

    if (!dataNascimento.trim()) {
      setDataNascimentoError('Informe a data de nascimento.');
      hasError = true;
    } else if (!validateDataNascimento(dataNascimento)) {
      setDataNascimentoError('Use o formato DD/MM/AAAA.');
      hasError = true;
    }

    if (selectedGenres.length === 0) {
      setPreferenciasError('Selecione pelo menos um gênero.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        telefone: normalizePhone(telefone),
        apelido: apelido.trim(),
       preferencias: selectedGenres.join(', '),
        data_nascimento: convertBrazilianDateToIso(dataNascimento.trim()),
      };

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
              placeholder="dd/mm/aaaa"
              keyboardType="numeric"
              value={dataNascimento}
              onChangeText={(text) => {
                setDataNascimento(formatDateNascimento(text));
                setDataNascimentoError('');
                setApiError('');
              }}
            />
            {dataNascimentoError ? (
              <Text style={styles.fieldErrorText}>{dataNascimentoError}</Text>
            ) : null}
          </View>

          <View>
            <Text style={styles.sectionLabel}>Preferências musicais</Text>

            <View style={styles.checkboxGroup}>
              {CLIENT_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.value);

                return (
                  <TouchableOpacity
                    key={genre.value}
                    style={styles.checkboxRow}
                    activeOpacity={0.85}
                    onPress={() => toggleGenre(genre.value)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>

                    <Text style={styles.checkboxLabel}>{genre.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  checkboxGroup: {
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4B5563',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    color: '#E5E7EB',
    fontSize: 14,
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