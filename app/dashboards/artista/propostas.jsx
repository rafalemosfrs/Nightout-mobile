import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { proposalService } from '../../../services/api';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

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

function normalizeStatus(status) {
  return String(status || 'PENDENTE').toUpperCase();
}

function isAccepted(status) {
  return ['ACEITA', 'ACEITO', 'APROVADA', 'APROVADO', 'CONFIRMADO'].includes(
    normalizeStatus(status)
  );
}

function isPending(status) {
  return ['PENDENTE', 'ENVIADA', 'ABERTA', 'DISPONÍVEL', 'DISPONIVEL'].includes(
    normalizeStatus(status)
  );
}

function getStatusStyle(status) {
  if (isAccepted(status)) return styles.statusSuccess;
  if (isPending(status)) return styles.statusPending;
  return styles.statusDanger;
}

function getStatusLabel(status) {
  if (isAccepted(status)) return 'Aceita';
  if (isPending(status)) return 'Pendente';
  if (normalizeStatus(status) === 'RECUSADA') return 'Recusada';
  return normalizeStatus(status);
}

function getProposalId(item) {
  return item?.id || item?.id_proposta || item?.id_proposta_casa || item?.uuid;
}

function normalizeProposal(item) {
  console.log('ITEM BRUTO PROPOSTA:', item);

  const evento = item?.evento || {};
  const casa = item?.casaDeShow || item?.casa || evento?.casaDeShow || {};

  console.log('EVENTO EXTRAIDO:', evento);
  console.log('CASA EXTRAIDA:', casa);

  const normalized = {
    id: getProposalId(item),
    data_proposta: item?.data_proposta || item?.createdAt || item?.created_at || null,
    data_evento: item?.data_evento || evento?.data_inicio || item?.data_inicio || null,
    valor_ofertado: Number(item?.valor_ofertado || item?.valor || 0),
    status: normalizeStatus(item?.status),
    termos: item?.termos || '',
    evento_titulo:
      item?.evento_titulo ||
      item?.titulo_evento ||
      evento?.titulo ||
      item?.titulo ||
      'Evento',
    casa_nome:
      item?.casa_nome ||
      item?.nome_casa ||
      casa?.nome_fantasia ||
      casa?.nome ||
      'Casa de show',
    local:
      item?.local ||
      item?.endereco ||
      evento?.local ||
      evento?.endereco ||
      casa?.endereco ||
      'Local nao informado',
  };

  console.log('PROPOSTA NORMALIZADA:', normalized);

  return normalized;
}

export default function ArtistProposalsScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadProposals = useCallback(async () => {
    const artistId = session?.id_usuario || session?.id;

    if (!artistId) {
      setError('Sessao invalida.');
      setProposals([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const response = await proposalService.listByArtist(artistId);

      console.log('RESPOSTA COMPLETA proposalService.listByArtist:', response);
      if (Array.isArray(response) && response.length > 0) {
        console.log('PRIMEIRA PROPOSTA RAW:', JSON.stringify(response[0], null, 2));
      } else {
        console.log('LISTA DE PROPOSTAS VAZIA OU INVALIDA');
      }

      const normalized = Array.isArray(response) ? response.map(normalizeProposal) : [];
      setProposals(normalized);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR PROPOSTAS:', requestError);
      setError(requestError?.message || 'Nao foi possivel carregar as propostas.');
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.id_usuario, session?.id]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => {
      const dateA = parseDate(a.data_evento)?.getTime() || 0;
      const dateB = parseDate(b.data_evento)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [proposals]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProposals();
  }

  async function updateProposalStatus(id, status) {
    try {
      setUpdatingId(id);
      console.log('ATUALIZANDO STATUS DA PROPOSTA:', { id, status });

      const result = await proposalService.update(id, { status });
      console.log('RESPOSTA UPDATE PROPOSAL:', result);

      setProposals((current) =>
        current.map((proposal) =>
          proposal.id === id ? { ...proposal, status: normalizeStatus(status) } : proposal
        )
      );

      Alert.alert('Sucesso', `Proposta ${status === 'ACEITA' ? 'aceita' : 'recusada'} com sucesso.`);
    } catch (requestError) {
      console.log('ERRO AO ATUALIZAR STATUS:', requestError);
      Alert.alert('Erro', requestError?.message || 'Nao foi possivel atualizar a proposta.');
    } finally {
      setUpdatingId(null);
    }
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

        {sortedProposals.length > 0 ? (
          sortedProposals.map((proposal) => {
            const isUpdating = updatingId === proposal.id;

            return (
              <View key={proposal.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{proposal.evento_titulo}</Text>
                    <Text style={styles.cardSubtitle}>{proposal.casa_nome}</Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                    <Text style={styles.statusText}>{getStatusLabel(proposal.status)}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Proposta: {formatDateTime(proposal.data_proposta)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    Evento: {formatDateTime(proposal.data_evento)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoText}>Local: {proposal.local}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
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

                {isPending(proposal.status) ? (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.proposalActionButton, styles.acceptButton]}
                      activeOpacity={0.85}
                      disabled={isUpdating}
                      onPress={() => updateProposalStatus(proposal.id, 'ACEITA')}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#10B981" />
                      ) : (
                        <Text style={[styles.proposalActionText, styles.acceptButtonText]}>
                          Aceitar
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.proposalActionButton, styles.rejectButton]}
                      activeOpacity={0.85}
                      disabled={isUpdating}
                      onPress={() => updateProposalStatus(proposal.id, 'RECUSADA')}
                    >
                      <Text style={[styles.proposalActionText, styles.rejectButtonText]}>
                        Recusar
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
              name="file-search-outline"
              size={46}
              color={colors.textMuted}
            />
            <Text style={styles.emptyStateTitle}>Nenhuma proposta encontrada</Text>
            <Text style={styles.emptyStateText}>
              Quando uma casa de show enviar propostas, elas aparecerao aqui.
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
  cardHeaderText: {
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
  },
  statusSuccess: {
    backgroundColor: 'rgba(25, 211, 138, 0.14)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
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
  },
  acceptButton: {
    borderColor: '#047857',
  },
  rejectButton: {
    borderColor: '#B91C1C',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  emptyStateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
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
});