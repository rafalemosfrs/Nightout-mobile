import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function RegisterArtistScreen() {
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [generoMusical, setGeneroMusical] = useState('');
  const [cacheMinimo, setCacheMinimo] = useState('');
  const [preferencias, setPreferencias] = useState('');

  const handleCreateAccount = () => {
    const payload = {
      nomeCompleto,
      email,
      telefone,
      senha,
      nomeArtistico,
      generoMusical,
      cacheMinimo,
      preferencias,
    };

    console.log('Cadastro do artista:', payload);
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
            onChangeText={setNomeCompleto}
          />

          <Input
            label="Email"
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Telefone"
            placeholder="+55 85 99999-9999"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />

          <Input
            label="Senha"
            placeholder="Senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <Input
            label="Nome Artístico"
            placeholder="Nome artístico"
            value={nomeArtistico}
            onChangeText={setNomeArtistico}
          />

          <Input
            label="Gênero Musical"
            placeholder="Ex: Forró, Funk, Sertanejo"
            value={generoMusical}
            onChangeText={setGeneroMusical}
          />

          <Input
            label="Cachê Mínimo (R$)"
            placeholder="Ex: 1500"
            keyboardType="numeric"
            value={cacheMinimo}
            onChangeText={setCacheMinimo}
          />

          <Input
            label="Preferências"
            placeholder="https://..."
            value={preferencias}
            onChangeText={setPreferencias}
          />
        </View>

        <Button
          title="Criar Conta"
          onPress={handleCreateAccount}
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
});