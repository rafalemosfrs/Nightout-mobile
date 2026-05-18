<<<<<<< HEAD
import React, { useState } from 'react';
import {
  Image,
=======
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
>>>>>>> integraçãoPerfil
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
<<<<<<< HEAD
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
=======
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button.jsx';
import LogoutModal from '../../components/logoutModal.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';
>>>>>>> integraçãoPerfil
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';
<<<<<<< HEAD
import Button from '../../components/Button';

const artistaMock = {
  nome: 'Nattan',
  email: 'nattan@gmail.com',
  tipo: 'Artista',
  status: 'Ativo',
  nomeArtistico: 'Nattan',
  generoMusical: 'Forró',
  cacheMinimo: '40.000',
  telefone: '85 9 84811171',
  portfolio: 'https://Nattan.com',
  foto:
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80',
};

export default function ArtistProfileScreen() {
  const [nomeArtistico, setNomeArtistico] = useState(artistaMock.nomeArtistico);
  const [generoMusical, setGeneroMusical] = useState(artistaMock.generoMusical);
  const [cacheMinimo, setCacheMinimo] = useState(artistaMock.cacheMinimo);
  const [email, setEmail] = useState(artistaMock.email);
  const [telefone, setTelefone] = useState(artistaMock.telefone);
  const [portfolio, setPortfolio] = useState(artistaMock.portfolio);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/artista')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Perfil do Artista</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.profileCard}>
          <Image source={{ uri: artistaMock.foto }} style={styles.avatarImage} />

          <Text style={styles.artistName}>{nomeArtistico || artistaMock.nome}</Text>
          <Text style={styles.artistEmail}>{email}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.artistBadge}>
              <Text style={styles.artistBadgeText}>{artistaMock.tipo}</Text>
            </View>

            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{artistaMock.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="music-note-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Informações do Artista</Text>
          </View>

          <InfoRow
            label="Nome Artístico"
            value={nomeArtistico}
            onChangeText={setNomeArtistico}
          />

          <InfoRow
            label="Gênero Musical"
            value={generoMusical}
            onChangeText={setGeneroMusical}
          />

          <InfoRow
            label="Cachê Mínimo"
            value={cacheMinimo}
            onChangeText={setCacheMinimo}
            keyboardType="numeric"
          />

          <InfoRow
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <InfoRow
            label="Telefone"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <InfoRow
            label="Portfólio"
            value={portfolio}
            onChangeText={setPortfolio}
          />
        </View>

        <View style={styles.logoutWrapper}>
          <Button
            title="Sair"
            variant="secondary"
            onPress={() => router.replace('/')}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, onChangeText, keyboardType = 'default' }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <TextInput
        style={styles.infoInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
=======

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
>>>>>>> integraçãoPerfil
      />
    </View>
  );
}

<<<<<<< HEAD
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
=======
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
    const artistId = session?.id_usuario || session?.id;

    if (!artistId) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }

    try {
      setError('');
      const response = await usersService.getArtist(artistId);

      setArtist(response);
      setForm({
        nome: response?.usuario?.nome || session?.nome || '',
        email: response?.usuario?.email || session?.email || '',
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
      setError(requestError?.message || 'Nao foi possivel carregar o perfil.');
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
    const artistId = session?.id_usuario || session?.id;
    if (!artistId) return;

    try {
      setSaving(true);
      setError('');

      await usersService.updateArtist(artistId, {
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
>>>>>>> integraçãoPerfil
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
<<<<<<< HEAD
    backgroundColor: colors.backgroundCard,
=======
    backgroundColor: 'rgba(26, 31, 46, 0.82)',
>>>>>>> integraçãoPerfil
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  profileCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: colors.secondary,
    marginBottom: spacing.md,
  },
  artistName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  artistEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
    textDecorationLine: 'underline',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  artistBadge: {
    backgroundColor: 'rgba(157, 78, 221, 0.24)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  artistBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  activeBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  sectionHeader: {
=======
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
>>>>>>> integraçãoPerfil
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
<<<<<<< HEAD
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  infoRow: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoInput: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    padding: 0,
    outlineStyle: 'none',
  },
  logoutWrapper: {
    marginTop: spacing.sm,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    height: 48,
  },
  logoutButtonText: {
    color: '#FF8A8A',
=======
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
>>>>>>> integraçãoPerfil
  },
});