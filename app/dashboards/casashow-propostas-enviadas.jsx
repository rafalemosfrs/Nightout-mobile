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
import { eventService, proposalService, usersService } from '../../services/api';
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
  return String(status || 'PENDENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function isAccepted(status) {
  return ['ACEITA', 'ACEITO', 'APROVADA', 'APROVADO', 'CONFIRMADO'].includes(
    normalizeStatus(status)
  );
}

function isRejected(status) {
  return ['RECUSADA', 'RECUSADO', 'CANCELADA', 'CANCELADO'].includes(
    normalizeStatus(status)
  );
}

function getStatusLabel(status) {
  const normalized = normalizeStatus(status);

  if (isAccepted(normalized)) return 'Aceita';
  if (isRejected(normalized)) return 'Recusada';

  return 'Pendente';
}

function getStatusStyle(status) {
  const normalized = normalizeStatus(status);

  if (isAccepted(normalized)) return styles.statusSuccess;
  if (isRejected(normalized)) return styles.statusDanger;

  return styles.statusPending;
}

function getStatusIconName(status) {
  const normalized = normalizeStatus(status);

  if (isAccepted(normalized)) return 'checkmark-circle-outline';
  if (isRejected(normalized)) return 'close-circle-outline';

  return 'time-outline';
}

function getProposalId(item) {
  return (
    item?.id_proposta_casa ||
    item?.id_proposta ||
    item?.id ||
    item?.uuid
  );
}

function getArtistName(artista) {
  return (
    artista?.nome_artista ||
    artista?.nome ||
    artista?.usuario?.nome ||
    'Artista nao informado'
  );
}

function getEventoTitle(evento) {
  return evento?.titulo || 'Evento sem titulo';
}

function getEventoLocal(evento) {
  return evento?.local || evento?.endereco || 'Local nao informado';
}

function normalizeProposal(item) {
  const artista = item?.artista || item?.Artista || {};
  const evento = item?.evento || item?.Evento || item?.event || {};

  return {
    id: getProposalId(item),
    idArtista: item?.id_artista || item?.idArtista || artista?.id_usuario || artista?.id || '',
    idEvento: item?.id_evento || item?.idEvento || evento?.id_evento || evento?.id || '',
    artistaNome:
      item?.artista_nome ||
      item?.nome_artista ||
      getArtistName(artista),
    dataEvento:
      item?.data_evento ||
      item?.dataEvento ||
      evento?.data_inicio ||
      evento?.data_evento ||
      null,
    tituloEvento:
      item?.evento_titulo ||
      item?.nome_evento ||
      item?.titulo ||
      getEventoTitle(evento),
    local:
      item?.evento_local ||
      item?.local_evento ||
      item?.local ||
      getEventoLocal(evento),
    valor: Number(item?.valor_ofertado || item?.valorOfertado || item?.valor || 0),
    status: normalizeStatus(item?.status),
    termos: item?.termos || '',
  };
}

async function enrichProposal(item) {
  const normalizedProposal = normalizeProposal(item);

  const [artistaResult, eventoResult] = await Promise.allSettled([
    normalizedProposal.idArtista
      ? usersService.getArtist(normalizedProposal.idArtista)
      : Promise.resolve(null),
    normalizedProposal.idEvento
      ? eventService.getById(normalizedProposal.idEvento)
      : Promise.resolve(null),
  ]);

  const artista =
    artistaResult.status === 'fulfilled' && artistaResult.value
      ? artistaResult.value
      : null;

  const evento =
    eventoResult.status === 'fulfilled' && eventoResult.value
      ? eventoResult.value
      : null;

  return {
    ...normalizedProposal,
    artista,
    evento,
    artistaNome: getArtistName(artista) || normalizedProposal.artistaNome,
    tituloEvento: getEventoTitle(evento) || normalizedProposal.tituloEvento,
    local: getEventoLocal(evento) || normalizedProposal.local,
    dataEvento:
      normalizedProposal.dataEvento ||
      evento?.data_inicio ||
      evento?.data_evento ||
      null,
  };
}

export default function CasaShowPropostasEnviadasScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const casaId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadProposals = useCallback(async () => {
    if (!casaId) {
      setError('Sessão inválida.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');

      console.log('CASA ID USADO NA BUSCA DE PROPOSTAS ENVIADAS:', casaId);

      const response = await proposalService.listByCasaShow(casaId);

      console.log('PROPOSTAS ENVIADAS - API:', JSON.stringify(response, null, 2));

      const proposalList = Array.isArray(response) ? response : [];

      const enriched = await Promise.all(
        proposalList.map((proposal) => enrichProposal(proposal))
      );

      console.log('PROPOSTAS ENVIADAS - ENRIQUECIDAS:', JSON.stringify(enriched, null, 2));

      setProposals(enriched);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR PROPOSTAS ENVIADAS:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar as propostas.');
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [casaId]);

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
          <Ionicons name="paper-plane-outline" size={28} color={colors.primary} />
          <Text style={styles.summaryValue}>{propostasEnviadas.length}</Text>
          <Text style={styles.summaryLabel}>propostas pendentes ou recusadas</Text>
        </View>

        {propostasEnviadas.length > 0 ? (
          propostasEnviadas.map((proposal) => (
            <View
              key={proposal.id || `${proposal.artistaNome}-${proposal.dataEvento}`}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <View style={styles.titleRow}>
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.artistName}>{proposal.artistaNome}</Text>
                  </View>

                  <View style={styles.eventRow}>
                    <Ionicons
                      name="ticket-outline"
                      size={15}
                      color={colors.primary}
                    />
                    <Text style={styles.eventTitle}>{proposal.tituloEvento}</Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                  <Ionicons
                    name={getStatusIconName(proposal.status)}
                    size={13}
                    color={colors.text}
                  />
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
                <View style={styles.valueRow}>
                  <Ionicons name="cash-outline" size={16} color="#19D38A" />
                  <Text style={styles.valueText}>{formatCurrency(proposal.valor)}</Text>
                </View>
              </View>

              {proposal.termos ? (
                <View style={styles.termsBox}>
                  <View style={styles.termsHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text style={styles.termsLabel}>Termos</Text>
                  </View>
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
    marginTop: spacing.xs,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
    flexShrink: 1,
  },
  eventTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 8,
    flexShrink: 1,
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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    ...typography.body,
    color: '#19D38A',
    fontWeight: '700',
    marginLeft: 6,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
  },
  termsBox: {
    marginTop: spacing.md,
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  termsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 6,
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