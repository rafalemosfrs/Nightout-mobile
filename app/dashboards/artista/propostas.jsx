import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { eventService, proposalService, usersService } from '../../../services/api';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../../constants/theme';
import {
  formatCurrency,
  formatDateTime,
  normalizeProposal,
  getProposalId,
} from '../../../utils/casaShowData';

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

function isPending(status) {
  return ['PENDENTE', 'ENVIADA', 'ABERTA', 'DISPONIVEL'].includes(
    normalizeStatus(status)
  );
}

function isRejected(status) {
  return ['RECUSADA', 'RECUSADO', 'CANCELADA', 'CANCELADO'].includes(
    normalizeStatus(status)
  );
}

function getStatusLabel(status) {
  if (isAccepted(status)) return 'ACEITA';
  if (isRejected(status)) return 'RECUSADA';
  if (isPending(status)) return 'DISPONÍVEL';
  return normalizeStatus(status);
}

function getStatusBadgeStyle(status) {
  if (isAccepted(status)) return styles.statusSuccessBadge;
  if (isRejected(status)) return styles.statusDangerBadge;
  if (isPending(status)) return styles.statusPendingBadge;
  return styles.statusNeutralBadge;
}

function getStatusTextStyle(status) {
  if (isAccepted(status)) return styles.statusSuccessText;
  if (isRejected(status)) return styles.statusDangerText;
  if (isPending(status)) return styles.statusPendingText;
  return styles.statusNeutralText;
}

function getCasaName(casa) {
  return (
    casa?.nome_fantasia ||
    casa?.nome ||
    casa?.usuario?.nome ||
    'Casa de show'
  );
}

function getEventoTitle(evento) {
  return evento?.titulo || 'Evento';
}

function getEventoLocal(evento) {
  return evento?.local || evento?.endereco || 'Local nao informado';
}

async function enrichProposal(proposal) {
  const normalizedProposal = normalizeProposal(proposal);

  const [eventoResult, casaResult] = await Promise.allSettled([
    normalizedProposal.id_evento
      ? eventService.getById(normalizedProposal.id_evento)
      : Promise.resolve(null),
    normalizedProposal.id_casa_show
      ? usersService.getCasaShow(normalizedProposal.id_casa_show)
      : Promise.resolve(null),
  ]);

  const evento =
    eventoResult.status === 'fulfilled' && eventoResult.value
      ? eventoResult.value
      : null;

  const casa =
    casaResult.status === 'fulfilled' && casaResult.value
      ? casaResult.value
      : null;

  return {
    ...normalizedProposal,
    evento,
    casaDeShow: casa,
    evento_titulo: getEventoTitle(evento) || normalizedProposal.evento_titulo,
    evento_local: getEventoLocal(evento) || normalizedProposal.evento_local,
    casa_nome: getCasaName(casa) || normalizedProposal.casa_nome,
  };
}

export default function ArtistProposalsScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const artistId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadProposals = useCallback(async () => {
    if (!artistId) {
      setError('Sessão inválida.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');

      console.log('ARTIST ID USADO NA BUSCA:', artistId);

      const response = await proposalService.listByArtist(artistId);

      console.log('PROPOSTAS DA API:', JSON.stringify(response, null, 2));

      const proposalList = Array.isArray(response) ? response : [];

      const enriched = await Promise.all(
        proposalList.map((proposal) => enrichProposal(proposal))
      );

      console.log('PROPOSTAS ENRIQUECIDAS:', JSON.stringify(enriched, null, 2));

      setProposals(enriched);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR PROPOSTAS:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar as propostas.');
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [artistId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProposals();
  }

  async function updateProposalStatus(id, status) {
    try {
      setUpdatingId(id);
      setError('');

      console.log('ID ENVIADO PARA ATUALIZAR PROPOSTA:', id);
      console.log('STATUS ENVIADO PARA ATUALIZAR PROPOSTA:', status);

      await proposalService.update(id, { status });

      setProposals((current) =>
        current.map((proposal) =>
          getProposalId(proposal) === id ? { ...proposal, status } : proposal
        )
      );
    } catch (requestError) {
      console.log('ERRO AO ATUALIZAR PROPOSTA:', requestError);

      setError(requestError?.message || 'Nao foi possivel atualizar a proposta.');
    } finally {
      setUpdatingId('');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
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
            onPress={() => router.push('/dashboards/artista')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas do artista</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Todas as propostas</Text>
          </View>
          <Text style={styles.heroText}>
            Consulte, aceite ou recuse as propostas recebidas.
          </Text>
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

        {proposals.length > 0 ? (
          proposals.map((proposal) => {
            const proposalId = getProposalId(proposal);
            const pending = isPending(proposal.status);
            const updating = updatingId === proposalId;

            return (
              <View key={proposalId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.cardTitle}>
                      {proposal.evento_titulo || 'Evento'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {proposal.casa_nome || 'Casa de show'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      getStatusBadgeStyle(proposal.status),
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        getStatusTextStyle(proposal.status),
                      ]}
                    >
                      {getStatusLabel(proposal.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    Proposta: {formatDateTime(proposal.data_proposta)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    Evento: {formatDateTime(proposal.data_evento)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    {proposal.evento_local || 'Local nao informado'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons
                    name="cash-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>
                    Valor ofertado: {formatCurrency(proposal.valor_ofertado)}
                  </Text>
                </View>

                {proposal.termos ? (
                  <View style={styles.termsBox}>
                    <Text style={styles.termsLabel}>Termos</Text>
                    <Text style={styles.termsText}>{proposal.termos}</Text>
                  </View>
                ) : null}

                {pending ? (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.proposalActionButton,
                        styles.acceptButton,
                        updating && styles.disabledButton,
                      ]}
                      activeOpacity={0.85}
                      disabled={updating}
                      onPress={() => updateProposalStatus(proposalId, 'ACEITA')}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={16}
                        color="#10B981"
                      />
                      <Text style={[styles.proposalActionText, styles.acceptButtonText]}>
                        {updating ? 'Salvando...' : 'Aceitar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.proposalActionButton,
                        styles.rejectButton,
                        updating && styles.disabledButton,
                      ]}
                      activeOpacity={0.85}
                      disabled={updating}
                      onPress={() => updateProposalStatus(proposalId, 'RECUSADA')}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={16}
                        color="#EF4444"
                      />
                      <Text style={[styles.proposalActionText, styles.rejectButtonText]}>
                        {updating ? 'Salvando...' : 'Recusar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={44}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>Nenhuma proposta encontrada</Text>
            <Text style={styles.emptyText}>
              Quando casas de show enviarem propostas, elas vão aparecer aqui.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
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
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  heroText: {
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
  titleBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.primary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 8,
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  statusSuccessBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusPendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusDangerBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusNeutralBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  statusSuccessText: {
    color: '#10B981',
  },
  statusPendingText: {
    color: '#F59E0B',
  },
  statusDangerText: {
    color: '#EF4444',
  },
  statusNeutralText: {
    color: colors.textSecondary,
  },
  termsBox: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  termsLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  proposalActionButton: {
    width: '48%',
    height: 42,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: colors.backgroundLight,
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  rejectButton: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  disabledButton: {
    opacity: 0.6,
  },
  proposalActionText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  acceptButtonText: {
    color: '#10B981',
  },
  rejectButtonText: {
    color: '#EF4444',
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
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});