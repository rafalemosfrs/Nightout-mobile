import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import LogoutModal from '../../components/logoutModal';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe';

export default function ProfileClienteScreen() {
  const router = useRouter();
  const { session, logout } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [apelido, setApelido] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [preferencias, setPreferencias] = useState('');

  useEffect(() => {
    async function loadCliente() {
      try {
        if (!session?.id_usuario) {
          throw new Error('Sessão inválida.');
        }

        setError('');
        const cliente = await usersService.getCliente(session.id_usuario);

        setNome(cliente?.usuario?.nome || session.nome || '');
        setEmail(cliente?.usuario?.email || session.email || '');
        setApelido(cliente?.apelido || '');
        setTelefone(cliente?.usuario?.telefone || '');
        setPreferencias(cliente?.preferencias || '');

        if (cliente?.data_nascimento) {
          const date = new Date(cliente.data_nascimento);
          if (!Number.isNaN(date.getTime())) {
            const formatted = new Intl.DateTimeFormat('pt-BR').format(date);
            setDataNascimento(formatted);
          } else {
            setDataNascimento('');
          }
        } else {
          setDataNascimento('');
        }
      } catch (requestError) {
        setError(requestError?.message || 'Não foi possível carregar o perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadCliente();
  }, [session]);

  const handleLogout = async () => {
    try {
      await logout();
      setModalVisible(false);
      router.replace('/login');
    } catch (logoutError) {
      console.log('Erro ao fazer logout:', logoutError);
    }
  };

  async function handleSave() {
    try {
      if (!session?.id_usuario) {
        throw new Error('Sessão inválida.');
      }

      setSaving(true);
      setError('');

      let dataNascimentoIso;

      if (dataNascimento.trim()) {
        const parts = dataNascimento.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          dataNascimentoIso = new Date(`${year}-${month}-${day}T00:00:00`).toISOString();
        }
      }

      await usersService.updateCliente(session.id_usuario, {
        apelido: apelido.trim(),
        preferencias: preferencias.trim(),
        data_nascimento: dataNascimentoIso,
        usuario: [
          {
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
          },
        ],
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (requestError) {
      setError(requestError?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5b8cff" />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.header}>
          <Image source={{ uri: DEFAULT_IMAGE }} style={styles.avatar} />

          <Text style={styles.name}>{nome || 'Cliente'}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.badges}>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeText}>Cliente</Text>
            </View>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeText}>Ativo</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Informações do Perfil</Text>

          <EditableItem label="Nome" value={nome} onChangeText={setNome} />
          <EditableItem label="Apelido" value={apelido} onChangeText={setApelido} />
          <EditableItem
            label="Data de nascimento"
            value={dataNascimento}
            onChangeText={setDataNascimento}
            placeholder="31/03/2006"
          />
          <EditableItem
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <EditableItem
            label="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
          <EditableItem
            label="Preferências"
            value={preferencias}
            onChangeText={setPreferencias}
          />

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
            ]}
          >
            <Text style={styles.saveText}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LogoutModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

function EditableItem({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7d8aa5"
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02142b',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#b0bac9',
    marginTop: 12,
    fontSize: 16,
  },

  errorCard: {
    backgroundColor: 'rgba(255, 59, 59, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 59, 0.35)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  errorText: {
    color: '#fff',
    textAlign: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },

  avatar: {
    width: 180,
    height: 180,
    borderRadius: 100,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#5b8cff',
    shadowColor: '#5b8cff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },

  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  email: {
    color: '#9aa4b2',
    marginBottom: 15,
  },

  badges: {
    flexDirection: 'row',
    gap: 12,
  },

  badgeBlue: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  badgeGreen: {
    backgroundColor: '#22c55e',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },

  infoContainer: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 15,
  },

  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a5a',
    paddingVertical: 14,
  },

  label: {
    color: '#b0bac9',
    fontSize: 15,
    fontWeight: '600',
  },

  input: {
    color: '#e4e9f2',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    paddingVertical: 4,
  },

  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },

  saveButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },

  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  footer: {
    marginTop: 30,
    alignItems: 'center',
  },

  logoutButton: {
    backgroundColor: '#ff3b3b',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
    alignItems: 'center',
  },

  logoutButtonPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#cc2f2f',
    opacity: 0.9,
  },

  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});