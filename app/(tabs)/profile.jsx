import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import LogoutModal from '../../components/logoutModal';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=900&h=900&fit=crop&auto=format';

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  multiline = false,
  keyboardType = 'default',
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          !editable && styles.inputDisabled,
        ]}
        placeholderTextColor={colors.textMuted}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function ProfileClienteScreen() {
  const { session, logout } = useAuth();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    apelido: '',
    data_nascimento: '',
    telefone: '',
    preferencias: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadCliente = useCallback(async () => {
    const clienteId = session?.id_usuario || session?.id;

    if (!clienteId) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const response = await usersService.getCliente(clienteId);

      let dataNascimentoFormatada = '';

      if (response?.data_nascimento) {
        const date = new Date(response.data_nascimento);
        if (!Number.isNaN(date.getTime())) {
          dataNascimentoFormatada = new Intl.DateTimeFormat('pt-BR').format(date);
        }
      }

      setForm({
        nome: response?.usuario?.nome || session?.nome || '',
        email: response?.usuario?.email || session?.email || '',
        apelido: response?.apelido || '',
        data_nascimento: dataNascimentoFormatada,
        telefone: response?.usuario?.telefone || '',
        preferencias: response?.preferencias || '',
      });
    } catch (requestError) {
      setError(requestError?.message || 'Nao foi possivel carregar o perfil.');
      setForm((current) => ({
        ...current,
        nome: session?.nome || '',
        email: session?.email || '',
      }));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCliente();
  }, [loadCliente]);

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    const clienteId = session?.id_usuario || session?.id;
    if (!clienteId) return;

    try {
      setSaving(true);
      setError('');

      let dataNascimentoIso;

      if (form.data_nascimento.trim()) {
        const parts = form.data_nascimento.split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          dataNascimentoIso = new Date(
            `${year}-${month}-${day}T00:00:00`
          ).toISOString();
        }
      }

      await usersService.updateCliente(clienteId, {
        apelido: form.apelido.trim(),
        preferencias: form.preferencias.trim(),
        data_nascimento: dataNascimentoIso,
        usuario: [
          {
            nome: form.nome.trim(),
            email: form.email.trim(),
            telefone: form.telefone.trim(),
          },
        ],
      });

      setEditing(false);
      await loadCliente();
    } catch (requestError) {
      setError(requestError?.message || 'Nao foi possivel salvar as alteracoes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      setModalVisible(false);
      router.replace('/');
    } finally {
      setLoggingOut(false);
    }
  }

  const clienteNome = form.apelido || form.nome || 'Cliente';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover">
            <LinearGradient
              colors={['rgba(10, 14, 26, 0.2)', 'rgba(10, 14, 26, 0.88)']}
              style={styles.heroOverlay}
            >
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.iconButton}
                  activeOpacity={0.85}
                  onPress={() => router.back()}
                >
                  <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  activeOpacity={0.85}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.heroContent}>
                <View style={styles.avatarWrapper}>
                  <Text style={styles.avatarFallback}>
                    {(clienteNome || 'CL').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>{clienteNome}</Text>
                <Text style={styles.heroSubtitle}>
                  {form.email || 'Perfil do cliente'}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.profileContainer}>
            <View style={styles.profileContent}>
              <Text style={styles.authTitle}>Perfil do cliente</Text>
              <Text style={styles.authSubtitle}>
                Dados carregados diretamente do microservico de usuarios.
              </Text>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Carregando dados...</Text>
                </View>
              ) : (
                <>
                  {error ? (
                    <TouchableOpacity
                      style={styles.errorCard}
                      activeOpacity={0.85}
                      onPress={loadCliente}
                    >
                      <Ionicons name="warning-outline" size={18} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <Field
                    label="Nome"
                    value={form.nome}
                    editable={editing}
                    onChangeText={(value) => updateFormField('nome', value)}
                  />

                  <Field
                    label="Apelido"
                    value={form.apelido}
                    editable={editing}
                    onChangeText={(value) => updateFormField('apelido', value)}
                  />

                  <Field
                    label="Email"
                    value={form.email}
                    editable={editing}
                    keyboardType="email-address"
                    onChangeText={(value) => updateFormField('email', value)}
                  />

                  <Field
                    label="Telefone"
                    value={form.telefone}
                    editable={editing}
                    keyboardType="phone-pad"
                    onChangeText={(value) => updateFormField('telefone', value)}
                  />

                  <Field
                    label="Data de nascimento"
                    value={form.data_nascimento}
                    editable={editing}
                    onChangeText={(value) => updateFormField('data_nascimento', value)}
                  />

                  <Field
                    label="Preferências"
                    value={form.preferencias}
                    editable={editing}
                    multiline
                    onChangeText={(value) => updateFormField('preferencias', value)}
                  />

                  {editing ? (
                    <View style={styles.actionsRow}>
                      <View style={styles.actionButtonWrapper}>
                        <Button
                          title="Cancelar"
                          variant="outline"
                          onPress={() => {
                            setEditing(false);
                            loadCliente();
                          }}
                        />
                      </View>

                      <View style={styles.actionButtonWrapper}>
                        <Button title="Salvar" onPress={handleSave} loading={saving} />
                      </View>
                    </View>
                  ) : (
                    <Button
                      title="Editar"
                      onPress={() => setEditing(true)}
                      style={styles.editButton}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.logoutButton}
                    activeOpacity={0.85}
                    onPress={() => setModalVisible(true)}
                  >
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text style={styles.logoutText}>Sair</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LogoutModal
        visible={modalVisible}
        isLoading={loggingOut}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroImage: {
    width: '100%',
    height: 320,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(26, 31, 46, 0.82)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarFallback: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -spacing.lg,
    ...shadows.large,
  },
  profileContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  authSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  loadingBox: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#3B455A',
    borderRadius: 10,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 14,
  },
  inputDisabled: {
    opacity: 0.68,
    backgroundColor: '#121827',
  },
  editButton: {
    marginTop: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButtonWrapper: {
    width: '48%',
  },
  logoutButton: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  logoutText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});