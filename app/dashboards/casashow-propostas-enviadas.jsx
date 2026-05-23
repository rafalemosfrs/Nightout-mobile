import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { proposalService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = parseDate(value);

  if (!date) return 'Data nao informada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function normalizeStatus(status) {
  return String(status || 'PENDENTE').toUpperCase();
}

function isAccepted(status) {
  return ['ACEITA', 'ACEITO', 'APROVADA', 'APROVADO', 'CONFIRMADO'].includes(
    normalizeStatus(status)
  );
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);
  if (isAccepted(normalized)) return 'Aceita';
  if (normalized === 'RECUSADA') return 'Recusada';
  return 'Pendente';
}

function getStatusStyle(status) {
  const normalized = normalizeStatus(status);

  if (isAccepted(normalized)) return styles.statusSuccess;
  if (normalized === 'RECUSADA') return styles.statusDanger;
  return styles.statusPending;
}

function getProposalId(item) {
  return item?.id || item?.id_proposta || item?.id_proposta_casa || item?.uuid;
}

function normalizeProposal(item) {
  const artista = item?.artista || {};
  const evento = item?.evento || {};

  return {
    id: getProposalId(item),
    artistaNome:
      item?.artista_nome ||
      artista?.nome_artista ||
      artista?.usuario?.nome ||
      'Artista nao informado',
    dataEvento: item?.data_evento || evento?.data_inicio || null,
    tituloEvento: evento?.titulo || item?.titulo || 'Evento sem titulo',
    local: evento?.local || item?.local || 'Local nao informado',
    valor: Number(item?.valor_ofertado || item?.valor || 0),
    status: normalizeStatus(item?.status),
    termos: item?.termos || '',
  };
}

export default function CasaShowPropostasEnviadasScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProposals = useCallback(async () => {
    const casaId = session?.id_usuario || session?.id;

    if (!casaId) {
      setError('Sessão inválida.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const response = await proposalService.listByCasaShow(casaId);
      const normalized = Array.isArray(response) ? response.map(normalizeProposal) : [];
      setProposals(normalized);
    } catch (requestError) {
      setError(requestError?.message || 'Nao foi possivel carregar as propostas.');
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const propostasEnviadas = useMemo(() => {
    return proposals
      .filter((proposal) => !isAccepted(proposal.status))
      .sort((a, b) => {
        const dateA = parseDate(a.dataEvento)?.getTime() || 0;
        const dateB = parseDate(b.dataEvento)?.getTime() || 0;
        return dateB - dateA;
      });
  }, [proposals]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProposals();
  }

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas Enviadas</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        {error ? (
          <TouchableOpacity
            style={styles.errorCard}
            activeOpacity={0.85}
            onPress={loadProposals}
          >
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{propostasEnviadas.length}</Text>
          <Text style={styles.summaryLabel}>propostas pendentes ou recusadas</Text>
        </View>

        {propostasEnviadas.length > 0 ? (
          propostasEnviadas.map((proposal) => (
            <View key={proposal.id || `${proposal.artistaNome}-${proposal.dataEvento}`} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.artistName}>{proposal.artistaNome}</Text>
                  <Text style={styles.eventTitle}>{proposal.tituloEvento}</Text>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                  <Text style={styles.statusText}>{getStatusLabel(proposal.status)}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{formatDateTime(proposal.dataEvento)}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{proposal.local}</Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.valueText}>{formatCurrency(proposal.valor)}</Text>
              </View>

              {proposal.termos ? (
                <View style={styles.termsBox}>
                  <Text style={styles.termsLabel}>Termos</Text>
                  <Text style={styles.termsText}>{proposal.termos}</Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="paper-plane-outline" size={42} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma proposta enviada</Text>
            <Text style={styles.emptyText}>
              As propostas enviadas pela casa aparecerao aqui.
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
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  artistName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  eventTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metaText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  footerRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  valueText: {
    ...typography.body,
    color: '#19D38A',
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  statusDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  termsBox: {
    marginTop: spacing.md,
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  termsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  emptyState: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.small,
  },
  emptyTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});