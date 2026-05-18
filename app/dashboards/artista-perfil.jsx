import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/api';

const FOTO_PADRAO =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80';

export default function ArtistProfileScreen() {
  const { session, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [generoMusical, setGeneroMusical] = useState('');
  const [cacheMinimo, setCacheMinimo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState(FOTO_PADRAO);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArtist() {
      try {
        if (!session?.id_usuario) {
          throw new Error('Sessão inválida.');
        }

        setError('');
        const artista = await usersService.getArtist(session.id_usuario);

        setNome(artista?.usuario?.nome || session.nome || '');
        setEmail(artista?.usuario?.email || session.email || '');
        setNomeArtistico(artista?.nome_artista || '');
        setGeneroMusical(artista?.genero_musical || '');
        setCacheMinimo(
          artista?.cache_min !== undefined && artista?.cache_min !== null
            ? String(artista.cache_min)
            : ''
        );
        setTelefone(artista?.usuario?.telefone || '');
        setPortfolio(artista?.portifolio || '');
        setDescricao(artista?.descricao || '');
        setFoto(FOTO_PADRAO);
      } catch (requestError) {
        setError(requestError?.message || 'Não foi possível carregar o perfil do artista.');
      } finally {
        setLoading(false);
      }
    }

    loadArtist();
  }, [session]);

  async function handleSave() {
    try {
      if (!session?.id_usuario) {
        throw new Error('Sessão inválida.');
      }

      setSaving(true);
      setError('');

      await usersService.updateArtist(session.id_usuario, {
        nome_artista: nomeArtistico.trim(),
        genero_musical: generoMusical.trim(),
        cache_min: cacheMinimo.trim(),
        descricao: descricao.trim(),
        portifolio: portfolio.trim(),
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

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.profileCard}>
          <Image source={{ uri: foto }} style={styles.avatarImage} />

          <Text style={styles.artistName}>{nomeArtistico || nome || 'Artista'}</Text>
          <Text style={styles.artistEmail}>{email}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.artistBadge}>
              <Text style={styles.artistBadgeText}>Artista</Text>
            </View>

            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Ativo</Text>
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

          <InfoRow
            label="Descrição"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />

          <Button
            title="Salvar Alterações"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>

        <View style={styles.logoutWrapper}>
          <Button
            title="Sair"
            variant="secondary"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <TextInput
        style={[styles.infoInput, multiline && styles.infoInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
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
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
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
  infoInputMultiline: {
    minHeight: 80,
  },
  saveButton: {
    marginTop: spacing.md,
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
  },
});