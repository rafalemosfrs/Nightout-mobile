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
import { proposalService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function getAvatarLabel(nome) {
  if (!nome) return 'AR';

  const partes = nome.trim().split(' ').filter(Boolean);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
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
  return ['PENDENTE', 'ENVIADA', 'ABERTA'].includes(normalizeStatus(status));
}

function getProposalId(item) {
  return item?.id || item?.id_proposta || item?.id_proposta_casa || item?.uuid;
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

function formatDateBadge(value) {
  const date = parseDate(value);

  if (!date) {
    return {
      month: '--',
      day: '--',
    };
  }

  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();

  return {
    month,
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function normalizeProposal(item) {
  const evento = item?.evento || {};
  const casa = item?.casaDeShow || item?.casa || evento?.casaDeShow || {};
  const date = item?.data_evento || evento?.data_inicio || item?.data_inicio;

  return {
    raw: item,
    id: getProposalId(item),
    title: evento?.titulo || item?.titulo || 'Proposta recebida',
    houseName:
      casa?.nome_fantasia ||
      casa?.nome ||
      item?.nome_casa ||
      item?.casa_nome ||
      'Casa de show',
    address:
      evento?.local ||
      casa?.endereco ||
      item?.local ||
      item?.endereco ||
      'Local nao informado',
    date,
    status: normalizeStatus(item?.status),
    value: Number(item?.valor_ofertado || item?.valor || 0),
    terms: item?.termos || '',
  };
}

function getStatusStyle(status) {
  if (isAccepted(status)) {
    return styles.statusSuccess;
  }

  if (isPending(status)) {
    return styles.statusPending;
  }

  return styles.statusDanger;
}

function getStatusLabel(status) {
  if (isAccepted(status)) return 'Aceita';
  if (isPending(status)) return 'Pendente';
  if (normalizeStatus(status) === 'RECUSADA') return 'Recusada';
  return normalizeStatus(status);
}

export default function ArtistDashboardScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadProposals = useCallback(async () => {
    if (!session?.id_usuario) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const response = await proposalService.listByArtist(session.id_usuario);
      setProposals(Array.isArray(response) ? response.map(normalizeProposal) : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar as propostas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.id_usuario]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const summary = useMemo(() => {
    const accepted = proposals.filter((item) => isAccepted(item.status));
    const pending = proposals.filter((item) => isPending(item.status));
    const now = Date.now();
    const futureAccepted = accepted.filter((item) => {
      const date = parseDate(item.date);
      return date ? date.getTime() >= now : false;
    });

    return {
      acceptedCount: accepted.length,
      pendingCount: pending.length,
      acceptedTotal: accepted.reduce((sum, item) => sum + item.value, 0),
      nextEvents: futureAccepted.length,
      acceptedDates: accepted
        .map((item) => item.date)
        .filter(Boolean)
        .slice(0, 8),
    };
  }, [proposals]);

  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => {
      const dateA = parseDate(a.date)?.getTime() || 0;
      const dateB = parseDate(b.date)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [proposals]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProposals();
  }

  async function handleProposalAction(proposal, status) {
    if (!proposal.id) {
      Alert.alert('Erro', 'A proposta nao possui ID para atualizacao.');
      return;
    }

    try {
      setUpdatingId(proposal.id);
      await proposalService.update(proposal.id, { status });
      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id ? { ...item, status: normalizeStatus(status) } : item
        )
      );
    } catch (requestError) {
      Alert.alert(
        'Erro',
        requestError.message || 'Nao foi possivel atualizar a proposta.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const artistName = session?.nome || session?.email || 'Artista';

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
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Dashboard do Artista</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/artista-perfil')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarLabel(artistName)}</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.artistName}>{artistName}</Text>

            <View style={styles.inlineRow}>
              <MaterialCommunityIcons
                name="music-note"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.heroMeta}>Propostas recebidas</Text>
            </View>

            <View style={styles.inlineRow}>
              <Ionicons
                name="mail-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.heroMetaSecondary}>{session?.email}</Text>
            </View>
          </View>
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

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconGreen}>
              <Ionicons name="cash-outline" size={18} color="#19D38A" />
            </View>
            <Text style={styles.statTitle}>Propostas aceitas</Text>
            <Text style={[styles.statValue, styles.valueGreen]}>
              {formatCurrency(summary.acceptedTotal)}
            </Text>
            <Text style={styles.statDescription}>
              {summary.acceptedCount} negociacoes fechadas
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconOrange}>
              <Ionicons name="document-text-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statTitle}>Pendentes</Text>
            <Text style={[styles.statValue, styles.valueOrange]}>
              {summary.pendingCount}
            </Text>
            <Text style={styles.statDescription}>Aguardando sua resposta</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconBlue}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statTitle}>Shows confirmados</Text>
            <Text style={[styles.statValue, styles.valueBlue]}>
              {summary.nextEvents}
            </Text>
            <Text style={styles.statDescription}>Datas futuras aceitas</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconPurple}>
              <MaterialCommunityIcons
                name="music-note-outline"
                size={18}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.statTitle}>Total de propostas</Text>
            <Text style={[styles.statValue, styles.valuePurple]}>
              {proposals.length}
            </Text>
            <Text style={styles.statDescription}>Historico recebido</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Mini calendario</Text>
          </View>

          {summary.acceptedDates.length > 0 ? (
            <View style={styles.calendarGrid}>
              {summary.acceptedDates.map((dateValue, index) => {
                const badge = formatDateBadge(dateValue);

                return (
                  <View key={`${dateValue}-${index}`} style={styles.calendarDay}>
                    <Text style={styles.calendarMonth}>{badge.month}</Text>
                    <Text style={styles.calendarDate}>{badge.day}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Datas aceitas aparecerao aqui assim que uma proposta for aprovada.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Propostas do artista</Text>
          </View>

          {sortedProposals.length > 0 ? (
            sortedProposals.map((proposal) => {
              const badge = formatDateBadge(proposal.date);
              const isUpdating = updatingId === proposal.id;

              return (
                <View key={proposal.id || `${proposal.title}-${proposal.date}`} style={styles.proposalCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{badge.month}</Text>
                    <Text style={styles.dateDay}>{badge.day}</Text>
                  </View>

                  <View style={styles.proposalContent}>
                    <View style={styles.proposalHeader}>
                      <Text style={styles.proposalTitle} numberOfLines={1}>
                        {proposal.title}
                      </Text>

                      <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                        <Text style={styles.statusText}>
                          {getStatusLabel(proposal.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.proposalHouse}>{proposal.houseName}</Text>

                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.proposalMeta}>{proposal.address}</Text>
                    </View>

                    <View style={styles.proposalFooter}>
                      <View style={styles.inlineRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.proposalMeta}>
                          {formatDateTime(proposal.date)}
                        </Text>
                      </View>

                      <Text style={styles.proposalValue}>
                        {formatCurrency(proposal.value)}
                      </Text>
                    </View>

                    {isPending(proposal.status) ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.proposalActionButton, styles.acceptButton]}
                          activeOpacity={0.85}
                          disabled={isUpdating}
                          onPress={() => handleProposalAction(proposal, 'ACEITA')}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color={colors.text} />
                          ) : (
                            <Text style={styles.proposalActionText}>Aceitar</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.proposalActionButton, styles.rejectButton]}
                          activeOpacity={0.85}
                          disabled={isUpdating}
                          onPress={() => handleProposalAction(proposal, 'RECUSADA')}
                        >
                          <Text style={styles.proposalActionText}>Recusar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
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
                Quando uma casa enviar uma proposta, ela aparecera neste painel.
              </Text>
            </View>
          )}
        </View>
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
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  heroInfo: {
    flex: 1,
  },
  artistName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroMeta: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: 6,
  },
  heroMetaSecondary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
    flexShrink: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  statTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 6,
  },
  statDescription: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statIconGreen: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(25, 211, 138, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconPurple: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(157, 78, 221, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconOrange: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueGreen: {
    color: '#19D38A',
  },
  valueBlue: {
    color: colors.primary,
  },
  valuePurple: {
    color: colors.secondary,
  },
  valueOrange: {
    color: '#F59E0B',
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
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  calendarDay: {
    width: 62,
    minHeight: 62,
    borderRadius: borderRadius.md,
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  calendarDate: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  proposalCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dateBox: {
    width: 54,
    minHeight: 54,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  proposalContent: {
    flex: 1,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  proposalTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  proposalHouse: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  proposalMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  proposalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  proposalValue: {
    ...typography.bodySmall,
    color: '#19D38A',
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  proposalActionButton: {
    minHeight: 38,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  proposalActionText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
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
  emptyStateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});