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
import LogoutModal from '../../components/logoutModal.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
import { getCasaAddress, normalizeCasa } from '../../utils/casaShowData';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=900&fit=crop&auto=format';

function Field({ label, value, onChangeText, editable = true, multiline = false }) {
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
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function ProfileCasaShowScreen() {
  const { session, logout } = useAuth();
  const [casa, setCasa] = useState(null);
  const [form, setForm] = useState({
    nome_fantasia: '',
    responsavel: '',
    email: '',
    telefone: '',
    cnpj: '',
    endereco: '',
    bairro: '',
    estado: '',
    cep: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadCasa = useCallback(async () => {
    if (!session?.id) return;

    try {
      setError('');
      const response = await usersService.getCasaShow(session.id);
      const normalized = normalizeCasa(response, session);
      setCasa(normalized);
      setForm({
        nome_fantasia: normalized.nome_fantasia || '',
        responsavel: normalized.responsavel || '',
        email: normalized.email || '',
        telefone: normalized.telefone || '',
        cnpj: normalized.cnpj || '',
        endereco: normalized.endereco || '',
        bairro: normalized.bairro || '',
        estado: normalized.estado || '',
        cep: normalized.cep || '',
      });
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar o perfil.');
      const normalized = normalizeCasa({}, session);
      setCasa(normalized);
      setForm((current) => ({
        ...current,
        nome_fantasia: normalized.nome_fantasia,
        responsavel: normalized.responsavel,
        email: normalized.email,
      }));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadCasa();
  }, [loadCasa]);

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!session?.id) return;

    try {
      setSaving(true);
      setError('');
      const payload = {
        nome_fantasia: form.nome_fantasia.trim(),
        telefone: form.telefone.trim(),
        endereco: form.endereco.trim(),
        bairro: form.bairro.trim(),
        estado: form.estado.trim(),
        cep: form.cep.trim(),
      };

      await usersService.updateCasaShow(session.id, payload);
      setEditing(false);
      await loadCasa();
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel salvar as alteracoes.');
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

  const casaName = form.nome_fantasia || casa?.nome_fantasia || 'Casa de Show';

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
                  onPress={() => router.push('/dashboards/casashow')}
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
                <Text style={styles.heroTitle}>{casaName}</Text>
                <Text style={styles.heroSubtitle}>
                  {getCasaAddress(form) || 'Perfil da casa de show'}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.profileContainer}>
            <View style={styles.profileContent}>
              <Text style={styles.authTitle}>Perfil da casa</Text>
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
                      onPress={loadCasa}
                    >
                      <Ionicons name="warning-outline" size={18} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </TouchableOpacity>
                  ) : null}

                  <Field
                    label="Nome da casa"
                    value={form.nome_fantasia}
                    editable={editing}
                    onChangeText={(value) => updateFormField('nome_fantasia', value)}
                  />

                  <Field
                    label="Responsavel"
                    value={form.responsavel}
                    editable={false}
                    onChangeText={(value) => updateFormField('responsavel', value)}
                  />

                  <Field
                    label="Email"
                    value={form.email}
                    editable={false}
                    onChangeText={(value) => updateFormField('email', value)}
                  />

                  <Field
                    label="Telefone"
                    value={form.telefone}
                    editable={editing}
                    onChangeText={(value) => updateFormField('telefone', value)}
                  />

                  <Field
                    label="CNPJ"
                    value={form.cnpj}
                    editable={false}
                    onChangeText={(value) => updateFormField('cnpj', value)}
                  />

                  <Field
                    label="Endereco"
                    value={form.endereco}
                    editable={editing}
                    onChangeText={(value) => updateFormField('endereco', value)}
                  />

                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Field
                        label="Bairro"
                        value={form.bairro}
                        editable={editing}
                        onChangeText={(value) => updateFormField('bairro', value)}
                      />
                    </View>

                    <View style={styles.halfField}>
                      <Field
                        label="Estado"
                        value={form.estado}
                        editable={editing}
                        onChangeText={(value) => updateFormField('estado', value)}
                      />
                    </View>
                  </View>

                  <Field
                    label="CEP"
                    value={form.cep}
                    editable={editing}
                    onChangeText={(value) => updateFormField('cep', value)}
                  />

                  {editing ? (
                    <View style={styles.actionsRow}>
                      <View style={styles.actionButtonWrapper}>
                        <Button
                          title="Cancelar"
                          variant="outline"
                          onPress={() => {
                            setEditing(false);
                            loadCasa();
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48.5%',
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
