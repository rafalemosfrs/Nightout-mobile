import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import Button from '../../components/Button.jsx';
import LogoutModal from '../../components/logoutModal.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80';

const CLIENT_GENRES = [
  { label: 'Forró', value: 'forro' },
  { label: 'Trap', value: 'trap' },
  { label: 'Funk', value: 'funk' },
  { label: 'Sertanejo', value: 'sertanejo' },
  { label: 'Outros', value: 'outros' },
];

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

function formatBirthDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function convertDisplayDateToIso(value) {
  if (!value?.trim()) return '';

  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length !== 8) return '';

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
}

function formatDateInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatPhone(value) {
  if (!value) return '';

  const digits = String(value).replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return String(value);
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith('55')) return `+${digits}`;

  return `+55${digits}`;
}

function normalizePreferenceValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parsePreferences(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(normalizePreferenceValue).filter(Boolean);
  }

  return String(value)
    .split(/[;,/|]/)
    .map(normalizePreferenceValue)
    .filter(Boolean);
}

function serializePreferences(selectedGenres) {
  return selectedGenres.join(';');
}

function formatPreferences(value) {
  const selectedGenres = parsePreferences(value);

  if (!selectedGenres.length) return '';

  const map = {
    forro: 'Forró',
    trap: 'Trap',
    funk: 'Funk',
    sertanejo: 'Sertanejo',
    outros: 'Outros',
  };

  return selectedGenres.map((item) => map[item] || item).join(', ');
}

export default function ProfileClienteScreen() {
  const { session, logout } = useAuth();

  const [client, setClient] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    apelido: '',
    telefone: '',
    data_nascimento: '',
    preferencias: '',
  });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadClient = useCallback(async () => {
    const clientId = session?.id_usuario || session?.id;

    if (!clientId) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }

    try {
      setError('');

      const response = await usersService.getCliente(clientId);
      const preferencias = response?.preferencias || session?.preferencias || '';

      setClient(response);
      setSelectedGenres(parsePreferences(preferencias));
      setForm({
        nome: response?.usuario?.nome || response?.nome || session?.nome || '',
        email: response?.usuario?.email || response?.email || session?.email || '',
        apelido: response?.apelido || '',
        telefone: formatPhone(response?.usuario?.telefone || response?.telefone || ''),
        data_nascimento: formatBirthDate(response?.data_nascimento),
        preferencias,
      });
    } catch (requestError) {
      const preferencias = session?.preferencias || '';

      setError(requestError?.message || 'Nao foi possivel carregar o perfil.');
      setClient(null);
      setSelectedGenres(parsePreferences(preferencias));
      setForm((current) => ({
        ...current,
        nome: session?.nome || '',
        email: session?.email || '',
        preferencias,
      }));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleGenre(value) {
    setSelectedGenres((current) => {
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      updateFormField('preferencias', serializePreferences(updated));

      return updated;
    });

    setError('');
  }

  async function handleSave() {
    const clientId = session?.id_usuario || session?.id;
    if (!clientId) return;

    try {
      setSaving(true);
      setError('');

      const preferencias = serializePreferences(selectedGenres);

      await usersService.updateCliente(clientId, {
        apelido: form.apelido.trim(),
        preferencias,
        data_nascimento: convertDisplayDateToIso(form.data_nascimento.trim()),
        usuario: [
          {
            nome: form.nome.trim(),
            email: form.email.trim(),
            telefone: normalizePhone(form.telefone),
          },
        ],
      });

      setEditing(false);
      await loadClient();
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

  function handleCancelEdit() {
    setEditing(false);
    loadClient();
  }

  const clientName = useMemo(() => {
    return form.apelido || form.nome || 'Cliente';
  }, [form.apelido, form.nome]);

  const formattedPreferences = useMemo(() => {
    return formatPreferences(form.preferencias);
  }, [form.preferencias]);

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
                  onPress={() => router.push('/(tabs)')}
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
                    {(clientName || 'CL').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>{clientName}</Text>
                <Text style={styles.heroSubtitle}>
                  {formattedPreferences || 'Perfil do cliente'}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.profileContainer}>
            <View style={styles.profileContent}>
              <Text style={styles.authTitle}>Perfil do cliente</Text>
              <Text style={styles.authSubtitle}>
                Dados carregados diretamente do microserviço de usuários.
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
                      onPress={loadClient}
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
                    keyboardType="numeric"
                    onChangeText={(value) =>
                      updateFormField('data_nascimento', formatDateInput(value))
                    }
                  />

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preferências musicais</Text>

                    {editing ? (
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
                    ) : (
                      <View style={[styles.input, styles.inputDisabled, styles.preferencesDisplay]}>
                        <Text style={styles.preferencesDisplayText}>
                          {formattedPreferences || 'Nenhuma preferência cadastrada'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {editing ? (
                    <View style={styles.actionsRow}>
                      <View style={styles.actionButtonWrapper}>
                        <Button
                          title="Cancelar"
                          variant="outline"
                          onPress={handleCancelEdit}
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
    backgroundColor: 'rgba(30, 64, 175, 0.9)',
    borderWidth: 2,
    borderColor: colors.secondary,
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
  preferencesDisplay: {
    justifyContent: 'center',
  },
  preferencesDisplayText: {
    color: colors.text,
    fontSize: 15,
  },
  checkboxGroup: {
    gap: 10,
    backgroundColor: '#121827',
    borderWidth: 1,
    borderColor: '#3B455A',
    borderRadius: 10,
    padding: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
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