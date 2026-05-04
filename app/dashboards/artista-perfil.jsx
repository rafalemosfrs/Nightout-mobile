import React, { useState } from 'react';
import {
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