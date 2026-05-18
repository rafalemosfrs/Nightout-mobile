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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
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
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80';

const FOTO_PADRAO =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80';

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

export default function ArtistProfileScreen() {
  const { session, logout } = useAuth();

  const [artist, setArtist] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    nome_artistico: '',
    genero_musical: '',
    cache_minimo: '',
    telefone: '',
    portfolio: '',
    descricao: '',
  });
  const [foto, setFoto] = useState(FOTO_PADRAO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadArtist = useCallback(async () => {
    if (!session?.id_usuario) return;

    try {
      setError('');
      const response = await usersService.getArtist(session.id_usuario);

      setArtist(response);
      setForm({
        nome: response?.usuario?.nome || session.nome || '',
        email: response?.usuario?.email || session.email || '',
        nome_artistico: response?.nome_artista || '',
        genero_musical: response?.genero_musical || '',
        cache_minimo:
          response?.cache_min !== undefined && response?.cache_min !== null
            ? String(response.cache_min)
            : '',
        telefone: response?.usuario?.telefone || '',
        portfolio: response?.portifolio || '',
        descricao: response?.descricao || '',
      });
      setFoto(FOTO_PADRAO);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar o perfil.');
      setArtist(null);
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
    loadArtist();
  }, [loadArtist]);

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!session?.id_usuario) return;

    try {
      setSaving(true);
      setError('');

      await usersService.updateArtist(session.id_usuario, {
        nome_artista: form.nome_artistico.trim(),
        genero_musical: form.genero_musical.trim(),
        cache_min: form.cache_minimo.trim(),
        descricao: form.descricao.trim(),
        portifolio: form.portfolio.trim(),
        usuario: [
          {
            nome: form.nome.trim(),
            email: form.email.trim(),
            telefone: form.telefone.trim(),
          },
        ],
      });

      setEditing(false);
      await loadArtist();
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

  const artistName = form.nome_artistico || form.nome || 'Artista';

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
                  onPress={() => router.push('/dashboards/artista')}
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
                    {(artistName || 'AR').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>{artistName}</Text>
                <Text style={styles.heroSubtitle}>
                  {form.genero_musical || 'Perfil do artista'}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.profileContainer}>
            <View style={styles.profileContent}>
              <Text style={styles.authTitle}>Perfil do artista</Text>
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
                      onPress={loadArtist}
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
                    label="Nome Artístico"
                    value={form.nome_artistico}
                    editable={editing}
                    onChangeText={(value) => updateFormField('nome_artistico', value)}
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
                    label="Gênero Musical"
                    value={form.genero_musical}
                    editable={editing}
                    onChangeText={(value) => updateFormField('genero_musical', value)}
                  />

                  <Field
                    label="Cachê Mínimo"
                    value={form.cache_minimo}
                    editable={editing}
                    keyboardType="numeric"
                    onChangeText={(value) => updateFormField('cache_minimo', value)}
                  />

                  <Field
                    label="Portfólio"
                    value={form.portfolio}
                    editable={editing}
                    onChangeText={(value) => updateFormField('portfolio', value)}
                  />

                  <Field
                    label="Descrição"
                    value={form.descricao}
                    editable={editing}
                    multiline
                    onChangeText={(value) => updateFormField('descricao', value)}
                  />

                  {editing ? (
                    <View style={styles.actionsRow}>
                      <View style={styles.actionButtonWrapper}>
                        <Button
                          title="Cancelar"
                          variant="outline"
                          onPress={() => {
                            setEditing(false);
                            loadArtist();
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