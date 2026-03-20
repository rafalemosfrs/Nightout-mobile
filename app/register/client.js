import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function RegisterClientScreen() {
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
          <Input label="Nome Completo" placeholder="Nome completo" />
          <Input label="Email" placeholder="Email" keyboardType="email-address" />
          <Input label="Telefone" placeholder="+55 85 99999-9999" keyboardType="phone-pad" />
          <Input label="Senha" placeholder="Senha" secureTextEntry />
          <Input label="Apelido" placeholder="Como prefere ser chamado" />
          <Input label="Data de Nascimento" placeholder="31/03/2006" />
          <Input
            label="Preferências"
            placeholder="Estilo musicais, tipos de eventos, etc."
          />
        </View>

        <Button title="Criar Conta" onPress={() => {}} style={styles.submitButton} />
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
});