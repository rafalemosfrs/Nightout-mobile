import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { proposalService } from '../../services/api';
import {
  formatCurrency,
  formatDateTime,
  isAcceptedProposal,
  normalizeProposal,
} from '../../utils/casaShowData';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

export default function CasaShowPropostasAceitasScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProposals = useCallback(async () => {
    if (!session?.id_usuario) return;

    try {
      setError('');
      const response = await proposalService.listByCasaShow(session.id_usuario);
      setProposals(Array.isArray(response) ? response.map(normalizeProposal) : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar propostas aceitas.');
    } finally {
      setLoading(false);
    }
  }, [session?.id_usuario]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const acceptedProposals = useMemo(
    () => proposals.filter((proposal) => isAcceptedProposal(proposal.status)),
    [proposals]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando propostas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas Aceitas</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadProposals}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="check-decagram-outline" size={28} color={colors.success} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{acceptedProposals.length}</Text>
            <Text style={styles.heroSubtitle}>propostas aceitas pela casa</Text>
          </View>
        </View>

        {acceptedProposals.length > 0 ? (
          acceptedProposals.map((proposal) => (
            <View key={proposal.id_proposta} style={styles.proposalCard}>
              <View style={styles.proposalInfo}>
                <Text style={styles.proposalTitle}>{proposal.artista_nome}</Text>
                <Text style={styles.proposalMeta}>{proposal.evento_titulo}</Text>
                <Text style={styles.proposalMeta}>{formatDateTime(proposal.data_evento)}</Text>
              </View>

              <View style={styles.valueBox}>
                <Text style={styles.valueText}>
                  {formatCurrency(proposal.valor_ofertado)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="file-search-outline" size={46} color={colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Nenhuma proposta aceita</Text>
            <Text style={styles.emptyStateText}>
              As propostas aceitas aparecerao aqui quando houver retorno dos artistas.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  iconPlaceholder: { width: 40, height: 40 },
  topBarTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
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
  errorText: { ...typography.bodySmall, color: colors.text, marginLeft: spacing.sm, flex: 1 },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroInfo: { marginLeft: spacing.md },
  heroTitle: { fontSize: 30, color: colors.text, fontWeight: '700' },
  heroSubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  proposalCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  proposalInfo: { flex: 1, marginRight: spacing.sm },
  proposalTitle: { ...typography.body, color: colors.text, fontWeight: '700' },
  proposalMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  valueBox: {
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  valueText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  emptyStateText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
});
