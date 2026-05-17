import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { registerCasaShowRequest } from '../../services/api';

const FORTALEZA_LOCATION = {
  geo_lat: '-3.71839',
  geo_lng: '-38.5434',
};

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizePhone(value) {
  const digits = onlyDigits(value);

  if (!digits) return value.trim();
  if (digits.startsWith('55')) return `+${digits}`;

  return `+55${digits}`;
}

function formatCnpj(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 14) return value.trim();

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
    5,
    8
  )}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function formatCep(value) {
  const digits = onlyDigits(value);

  if (digits.length !== 8) return value.trim();

  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

export default function RegisterCasaShowScreen() {
  const [nomeCasa, setNomeCasa] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!nomeCasa.trim()) newErrors.nomeCasa = 'Nome da casa é obrigatório';
    if (!nomeFantasia.trim()) newErrors.nomeFantasia = 'Nome fantasia é obrigatório';
    if (!cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email inválido';
    if (!telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!senha || senha.length < 6) newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    if (!capacidade.trim() || isNaN(capacidade)) newErrors.capacidade = 'Capacidade inválida (apenas números)';
    if (!endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';
    if (!bairro.trim()) newErrors.bairro = 'Bairro é obrigatório';
    if (!estado.trim()) newErrors.estado = 'Estado é obrigatório';
    if (!cep.trim()) newErrors.cep = 'CEP é obrigatório';

    if (cnpj.trim() && onlyDigits(cnpj).length !== 14) newErrors.cnpj = 'CNPJ invalido';
    if (telefone.trim() && onlyDigits(telefone).length < 10) newErrors.telefone = 'Telefone invalido';
    if (capacidade.trim() && !onlyDigits(capacidade)) {
      newErrors.capacidade = 'Capacidade invalida (apenas numeros)';
    }
    if (cep.trim() && onlyDigits(cep).length !== 8) newErrors.cep = 'CEP invalido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    setApiError('');
    if (validate()) {
      try {
        setLoading(true);
        const payload = {
          nome: nomeCasa.trim(),
          email: email.trim().toLowerCase(),
          telefone: normalizePhone(telefone),
          senha,
          nome_fantasia: nomeFantasia.trim(),
          cnpj: formatCnpj(cnpj),
          capacidade: onlyDigits(capacidade),
          endereco: endereco.trim(),
          bairro: bairro.trim(),
          estado: estado.trim().toUpperCase(),
          cep: formatCep(cep),
          ...FORTALEZA_LOCATION,
        };

        const data = await registerCasaShowRequest(payload);
        Alert.alert('Sucesso', data.message || 'Cadastro realizado com sucesso!');
        router.replace('/');
      } catch (error) {
        setApiError(error.message);
      } finally {
        setLoading(false);
      }
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
        <Text style={styles.title}>Cadastrar Casa de Show</Text>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Input
              label="Nome da Casa"
              placeholder="Nome do estabelecimento (Razão Social)"
              value={nomeCasa}
              onChangeText={(text) => { setNomeCasa(text); setErrors({...errors, nomeCasa: null}); }}
            />
            {errors.nomeCasa && <Text style={styles.errorText}>{errors.nomeCasa}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Nome Fantasia"
              placeholder="Nome Fantasia"
              value={nomeFantasia}
              onChangeText={(text) => { setNomeFantasia(text); setErrors({...errors, nomeFantasia: null}); }}
            />
            {errors.nomeFantasia && <Text style={styles.errorText}>{errors.nomeFantasia}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              keyboardType="numeric"
              value={cnpj}
              onChangeText={(text) => { setCnpj(text); setErrors({...errors, cnpj: null}); }}
            />
            {errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Email"
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors({...errors, email: null}); }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Telefone"
              placeholder="+55 11 99999-9999"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={(text) => { setTelefone(text); setErrors({...errors, telefone: null}); }}
            />
            {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Senha"
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={(text) => { setSenha(text); setErrors({...errors, senha: null}); }}
            />
            {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Capacidade"
              placeholder="Ex: 500"
              keyboardType="numeric"
              value={capacidade}
              onChangeText={(text) => { setCapacidade(text); setErrors({...errors, capacidade: null}); }}
            />
            {errors.capacidade && <Text style={styles.errorText}>{errors.capacidade}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Endereço"
              placeholder="Avenida Paulista, 1000"
              value={endereco}
              onChangeText={(text) => { setEndereco(text); setErrors({...errors, endereco: null}); }}
            />
            {errors.endereco && <Text style={styles.errorText}>{errors.endereco}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Bairro"
              placeholder="Bela Vista"
              value={bairro}
              onChangeText={(text) => { setBairro(text); setErrors({...errors, bairro: null}); }}
            />
            {errors.bairro && <Text style={styles.errorText}>{errors.bairro}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Estado"
              placeholder="SP"
              value={estado}
              onChangeText={(text) => { setEstado(text); setErrors({...errors, estado: null}); }}
            />
            {errors.estado && <Text style={styles.errorText}>{errors.estado}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="CEP"
              placeholder="00000-000"
              keyboardType="numeric"
              value={cep}
              onChangeText={(text) => { setCep(text); setErrors({...errors, cep: null}); }}
            />
            {errors.cep && <Text style={styles.errorText}>{errors.cep}</Text>}
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
  inputWrapper: {
    marginBottom: 0,
  },
  submitButton: {
    marginTop: 36,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  apiErrorText: {
    color: '#FF6B6B',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
});
