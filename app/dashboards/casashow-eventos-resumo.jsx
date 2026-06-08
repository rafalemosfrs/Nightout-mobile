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
import { eventService, proposalService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';
import {
  formatDateTime,
  getEventId,
  isFutureOrToday,
  normalizeEvent,
  normalizeProposal,
  parseApiDate,
} from '../../utils/casaShowData';

function getLifecycleStatus(eventItem) {
  const status = String(eventItem?.status || '').toUpperCase();

  if (status === 'CANCELADO') return 'CANCELADO';
  return isFutureOrToday(eventItem.data_inicio) ? 'ATIVO' : 'FINALIZADO';
}

function getStatusLabel(status) {
  if (status === 'ATIVO') return 'Ativo';
  if (status === 'CANCELADO') return 'Cancelado';
  return 'Finalizado';
}

function getStatusStyle(status) {
  if (status === 'ATIVO') return styles.statusActive;
  if (status === 'CANCELADO') return styles.statusCanceled;
  return styles.statusFinished;
}

function getProposalEventId(proposal) {
  return (
    proposal?.id_evento ||
    proposal?.idEvento ||
    proposal?.evento?.id_evento ||
    proposal?.evento?.id ||
    ''
  );
}

function groupEventsByMonth(events) {
  return events.reduce((acc, eventItem) => {
    const date = parseApiDate(eventItem.data_inicio);
    const key = date
      ? new Intl.DateTimeFormat('pt-BR', {
          month: 'long',
          year: 'numeric',
        }).format(date)
      : 'Sem data';

    if (!acc[key]) acc[key] = [];
    acc[key].push(eventItem);
    return acc;
  }, {});
}

export default function CasaShowEventosResumoScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const casaId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadEvents = useCallback(async () => {
    if (!casaId) {
      setError('Sessão inválida.');
      setEvents([]);
      setProposals([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');

      console.log('CASA ID USADO NO RESUMO DE EVENTOS:', casaId);

      const [eventsResponse, proposalsResponse] = await Promise.all([
        eventService.listByCasaShow(casaId),
        proposalService.listByCasaShow(casaId),
      ]);

      console.log('EVENTOS DA CASA - RESUMO:', JSON.stringify(eventsResponse, null, 2));
      console.log('PROPOSTAS DA CASA - RESUMO:', JSON.stringify(proposalsResponse, null, 2));

      const normalizedEvents = Array.isArray(eventsResponse)
        ? eventsResponse.map(normalizeEvent)
        : [];

      const normalizedProposals = Array.isArray(proposalsResponse)
        ? proposalsResponse.map(normalizeProposal)
        : [];

      setEvents(normalizedEvents);
      setProposals(normalizedProposals);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR RESUMO DE EVENTOS:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar os eventos.');
      setEvents([]);
      setProposals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [casaId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const proposalEventIds = useMemo(() => {
    return new Set(
      proposals
        .map((proposal) => getProposalEventId(proposal))
        .filter(Boolean)
    );
  }, [proposals]);

  const summary = useMemo(() => {
    const ativos = events.filter((item) => getLifecycleStatus(item) === 'ATIVO').length;
    const finalizados = events.filter((item) => getLifecycleStatus(item) === 'FINALIZADO').length;
    const cancelados = events.filter((item) => getLifecycleStatus(item) === 'CANCELADO').length;

    return {
      total: events.length,
      ativos,
      finalizados,
      cancelados,
    };
  }, [events]);

  const groupedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
      const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;
      return dateA - dateB;
    });

    return groupEventsByMonth(sorted);
  }, [events]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
  }

  function handleSendProposal(eventId) {
    router.push({
      pathname: '/dashboards/casashow-propostas',
      params: { id_evento: eventId },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando eventos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const monthEntries = Object.entries(groupedEvents);

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

          <Text style={styles.topBarTitle}>Eventos da Casa</Text>

          <View style={styles.iconPlaceholder} />
        </View>

        {error ? (
          <TouchableOpacity
            style={styles.errorCard}
            activeOpacity={0.85}
            onPress={loadEvents}
          >
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.ativos}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.finalizados}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.cancelados}</Text>
            <Text style={styles.statLabel}>Cancelados</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openManagerButton}
          activeOpacity={0.85}
          onPress={() => router.push('/dashboards/casashow-eventos')}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.text} />
          <Text style={styles.openManagerButtonText}>Abrir gerenciamento completo</Text>
        </TouchableOpacity>

        {monthEntries.length > 0 ? (
          monthEntries.map(([month, monthEvents]) => (
            <View key={month} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{month}</Text>

              {monthEvents.map((eventItem) => {
                const eventId = getEventId(eventItem);
                const lifecycleStatus = getLifecycleStatus(eventItem);
                const hasProposal = proposalEventIds.has(eventId);
                const canSendProposal = lifecycleStatus === 'ATIVO' && !hasProposal;

                return (
                  <View key={eventId} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventHeaderText}>
                        <Text style={styles.eventTitle}>{eventItem.titulo}</Text>
                        <Text style={styles.eventDescription} numberOfLines={2}>
                          {eventItem.descricao}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, getStatusStyle(lifecycleStatus)]}>
                        <Text style={styles.statusText}>
                          {getStatusLabel(lifecycleStatus)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {formatDateTime(eventItem.data_inicio)} ate{' '}
                        {formatDateTime(eventItem.data_fim)}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{eventItem.local}</Text>
                    </View>

                    {hasProposal ? (
                      <View style={styles.proposalSentBox}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color={colors.success}
                        />
                        <Text style={styles.proposalSentText}>Proposta enviada</Text>
                      </View>
                    ) : null}

                    {canSendProposal ? (
                      <TouchableOpacity
                        style={styles.sendProposalButton}
                        activeOpacity={0.85}
                        onPress={() => handleSendProposal(eventId)}
                      >
                        <Ionicons name="paper-plane-outline" size={16} color={colors.text} />
                        <Text style={styles.sendProposalButtonText}>Enviar proposta</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={42} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
            <Text style={styles.emptyText}>
              Quando a casa cadastrar eventos, eles aparecerao aqui.
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
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  openManagerButton: {
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  openManagerButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  eventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventHeaderText: {
    flex: 1,
    marginRight: spacing.sm,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  statusFinished: {
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  statusCanceled: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  proposalSentBox: {
    marginTop: spacing.md,
    minHeight: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  proposalSentText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '700',
    marginLeft: 8,
  },
  sendProposalButton: {
    marginTop: spacing.md,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sendProposalButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
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