import React, { useState } from 'react';
import { ScrollView, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function RegisterCasaShowScreen() {
  const [nomeCasa, setNomeCasa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [endereco, setEndereco] = useState('');

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!nomeCasa.trim()) newErrors.nomeCasa = 'Nome da casa é obrigatório';
    if (!cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    if (!telefone.trim()) newErrors.telefone = 'Telefone é obrigatório';
    if (!senha || senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }
    if (!capacidade.trim() || isNaN(capacidade)) {
      newErrors.capacidade = 'Capacidade inválida (apenas números)';
    }
    if (!endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = () => {
    if (validate()) {
      const payload = {
        nomeCasa,
        cnpj,
        email,
        telefone,
        senha,
        capacidade,
        endereco,
      };

      console.log('Cadastro da casa de show:', payload);
      // Aqui seria implementada a chamada para a API
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

          <Text style={styles.topBarTitle}>Cadastrar Casa de Show</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Input
              label="Nome da Casa"
              placeholder="Nome do estabelecimento"
              value={nomeCasa}
              onChangeText={(text) => {
                setNomeCasa(text);
                setErrors({ ...errors, nomeCasa: null });
              }}
            />
            {errors.nomeCasa && <Text style={styles.errorText}>{errors.nomeCasa}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              keyboardType="numeric"
              value={cnpj}
              onChangeText={(text) => {
                setCnpj(text);
                setErrors({ ...errors, cnpj: null });
              }}
            />
            {errors.cnpj && <Text style={styles.errorText}>{errors.cnpj}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Email"
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: null });
              }}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Telefone"
              placeholder="+55 11 99999-9999"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={(text) => {
                setTelefone(text);
                setErrors({ ...errors, telefone: null });
              }}
            />
            {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Senha"
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={(text) => {
                setSenha(text);
                setErrors({ ...errors, senha: null });
              }}
            />
            {errors.senha && <Text style={styles.errorText}>{errors.senha}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Capacidade"
              placeholder="Ex: 500"
              keyboardType="numeric"
              value={capacidade}
              onChangeText={(text) => {
                setCapacidade(text);
                setErrors({ ...errors, capacidade: null });
              }}
            />
            {errors.capacidade && <Text style={styles.errorText}>{errors.capacidade}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Endereço"
              placeholder="Avenida Paulista, 1000 - São Paulo"
              value={endereco}
              onChangeText={(text) => {
                setEndereco(text);
                setErrors({ ...errors, endereco: null });
              }}
            />
            {errors.endereco && <Text style={styles.errorText}>{errors.endereco}</Text>}
          </View>
        </View>

        <Button
          title="Criar Conta"
          onPress={handleCreateAccount}
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
});