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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { eventService, proposalService, usersService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  formatDateTime,
  formatTimeOnly,
  getCasaAddress,
  getEventId,
  isAcceptedProposal,
  isFutureOrToday,
  normalizeCasa,
  normalizeEvent,
  normalizeProposal,
  parseApiDate,
} from '../../utils/casaShowData';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function buildCalendarMatrix(month, year) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const weeks = [];
  let currentDay = 1 - firstDayOfMonth;

  while (currentDay <= totalDays) {
    const week = [];

    for (let i = 0; i < 7; i += 1) {
      week.push(currentDay < 1 || currentDay > totalDays ? null : currentDay);
      currentDay += 1;
    }

    weeks.push(week);
  }

  return weeks;
}

function getStatusStyle(status) {
  return isAcceptedProposal(status) || status === 'Confirmado'
    ? styles.statusSuccess
    : styles.statusPending;
}

function getProposalStatusLabel(status) {
  const normalized = String(status || 'PENDENTE').toUpperCase();
  if (isAcceptedProposal(normalized)) return 'Aceita';
  if (normalized === 'RECUSADA') return 'Recusada';
  return 'Pendente';
}

export default function CasaShowDashboardScreen() {
  const { session } = useAuth();
  const [casa, setCasa] = useState(null);
  const [events, setEvents] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

const loadDashboard = useCallback(async () => {
  if (!session?.id) {
    setCasa(null);
    setEvents([]);
    setProposals([]);
    setLoading(false);
    setRefreshing(false);
    return;
  }

  try {
      setError('');

      const [casaResult, eventsResult, proposalsResult] = await Promise.allSettled([
        usersService.getCasaShow(session.id),
        eventService.listByCasaShow(session.id),
        proposalService.listByCasaShow(session.id),
      ]);

      if (casaResult.status === 'fulfilled') {
        setCasa(normalizeCasa(casaResult.value, session));
      } else {
        setCasa(normalizeCasa({}, session));
      }

      if (eventsResult.status === 'fulfilled') {
        setEvents(Array.isArray(eventsResult.value) ? eventsResult.value.map(normalizeEvent) : []);
      } else {
        setEvents([]);
      }

      if (proposalsResult.status === 'fulfilled') {
        setProposals(
          Array.isArray(proposalsResult.value)
            ? proposalsResult.value.map(normalizeProposal)
            : []
        );
      } else {
        setProposals([]);
      }

      if (
        casaResult.status === 'rejected' ||
        eventsResult.status === 'rejected' ||
        proposalsResult.status === 'rejected'
      ) {
        setError('Alguns dados nao puderam ser carregados. Puxe para atualizar.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar a dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboard = useMemo(() => {
    const now = Date.now();
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
      const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;
      return dateA - dateB;
    });

    const upcomingEvents = sortedEvents.filter((eventItem) =>
      isFutureOrToday(eventItem.data_inicio)
    );

    const acceptedProposals = proposals.filter((proposal) =>
      isAcceptedProposal(proposal.status)
    );

    const proposalsByEvent = new Set(
      proposals.map((proposal) => proposal.id_evento).filter(Boolean)
    );

    const nextEvent = upcomingEvents[0] || null;
    const current = new Date();
    const month = current.getMonth() + 1;
    const year = current.getFullYear();
    const eventsThisMonth = sortedEvents.filter((eventItem) => {
      const date = parseApiDate(eventItem.data_inicio);
      return date && date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const eventsByDay = eventsThisMonth.reduce((acc, eventItem) => {
      const date = parseApiDate(eventItem.data_inicio);
      if (!date) return acc;

      const day = date.getDate();
      acc[day] = acc[day] || [];
      acc[day].push(eventItem);
      return acc;
    }, {});

    return {
      now,
      sortedEvents,
      upcomingEvents,
      acceptedProposals,
      proposalsByEvent,
      nextEvent,
      month,
      year,
      daysWithEvents: Object.keys(eventsByDay).map(Number),
      eventsByDay,
      resumo: {
        eventosCasa: events.length,
        proximosEventos: upcomingEvents.length,
        propostasEnviadas: proposals.length,
        propostasAceitas: acceptedProposals.length,
      },
    };
  }, [events, proposals]);

  const calendarWeeks = useMemo(
    () => buildCalendarMatrix(dashboard.month, dashboard.year),
    [dashboard.month, dashboard.year]
  );

  const selectedDayEvents = dashboard.eventsByDay[selectedDay] || [];
  const casaData = casa || normalizeCasa({}, session || {});

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
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

  const summaryCards = [
    {
      title: 'Eventos da casa',
      value: dashboard.resumo.eventosCasa,
      subtitle: 'Total cadastrado',
      icon: 'calendar-outline',
      onPress: () => router.push('/dashboards/casashow-eventos-resumo'),
    },
    {
      title: 'Proximos eventos',
      value: dashboard.resumo.proximosEventos,
      subtitle: 'Agenda futura',
      icon: 'time-outline',
    },
    {
      title: 'Propostas enviadas',
      value: dashboard.resumo.propostasEnviadas,
      subtitle: 'Aguardando retorno',
      icon: 'paper-plane-outline',
      onPress: () => router.push('/dashboards/casashow-propostas-enviadas'),
    },
    {
      title: 'Propostas aceitas',
      value: dashboard.resumo.propostasAceitas,
      subtitle: 'Negociacoes fechadas',
      icon: 'checkmark-circle-outline',
      onPress: () => router.push('/dashboards/casashow-propostas-aceitas'),
    },
  ];

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
          <View style={styles.iconPlaceholder} />

          <Text style={styles.topBarTitle}>Dashboard Casa de Show</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile-casa-show')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadDashboard}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons
              name="office-building"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{casaData.nome_fantasia}</Text>
            <Text style={styles.heroSubtitle}>CASA DE SHOW</Text>
            <Text style={styles.heroSecondaryText}>
              {getCasaAddress(casaData) || 'Endereco nao informado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.eventsShortcutCard}
          activeOpacity={0.85}
          onPress={() => router.push('/dashboards/casashow-eventos')}
        >
          <View style={styles.eventsShortcutLeft}>
            <View style={styles.eventsShortcutIcon}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>

            <View style={styles.eventsShortcutTextBox}>
              <Text style={styles.eventsShortcutTitle}>Gerenciar eventos</Text>
              <Text style={styles.eventsShortcutSubtitle}>
                Abrir listagem e criar novos eventos da casa
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.statsGrid}>
          {summaryCards.map((card) => {
            const CardComponent = card.onPress ? TouchableOpacity : View;

            return (
              <CardComponent
                key={card.title}
                style={styles.statCard}
                activeOpacity={0.85}
                onPress={card.onPress}
              >
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>{card.title}</Text>
                  <View style={styles.statIcon}>
                    <Ionicons name={card.icon} size={18} color={colors.primary} />
                  </View>
                </View>

                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statSubtitle}>{card.subtitle}</Text>
              </CardComponent>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Proximos eventos</Text>
          </View>

          {dashboard.upcomingEvents.length > 0 ? (
            dashboard.upcomingEvents.slice(0, 4).map((eventItem) => {
              const eventId = getEventId(eventItem);
              const hasProposal = dashboard.proposalsByEvent.has(eventId);

              return (
                <View key={eventId} style={styles.nextEventCard}>
                  <View style={styles.nextEventTopRow}>
                    <View style={styles.nextEventTextBox}>
                      <Text style={styles.nextEventTitle}>{eventItem.titulo}</Text>
                      <Text style={styles.nextEventText}>
                        {formatDateTime(eventItem.data_inicio)}
                      </Text>
                      <Text style={styles.nextEventText}>{eventItem.local}</Text>
                    </View>

                    {!hasProposal ? (
                      <TouchableOpacity
                        style={styles.addProposalButton}
                        activeOpacity={0.85}
                        onPress={() =>
                          router.push({
                            pathname: '/dashboards/casashow-propostas',
                            params: { id_evento: eventId },
                          })
                        }
                      >
                        <Text style={styles.addProposalButtonText}>Adicionar proposta</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum evento futuro.</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Dados da casa</Text>
          </View>

          <View style={styles.detailGrid}>
            {[
              ['Nome da casa', casaData.nome_fantasia],
              ['Responsavel', casaData.responsavel],
              ['Email', casaData.email || 'Nao informado'],
              ['Telefone', casaData.telefone || 'Nao informado'],
              ['Endereco', getCasaAddress(casaData) || 'Nao informado'],
            ].map(([label, value]) => (
              <View key={label} style={styles.detailItemFull}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Proximo evento da casa</Text>
          </View>

          {dashboard.nextEvent ? (
            <View style={styles.nextEventCard}>
              <Text style={styles.nextEventTitle}>{dashboard.nextEvent.titulo}</Text>
              <Text style={styles.nextEventText}>
                {formatDateTime(dashboard.nextEvent.data_inicio)}
              </Text>
              <Text style={styles.nextEventText}>{dashboard.nextEvent.local}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento futuro.</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="music-note-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Propostas da casa</Text>
          </View>

          {proposals.length > 0 ? (
            proposals.slice(0, 4).map((proposal) => (
              <View key={proposal.id_proposta} style={styles.proposalCard}>
                <View style={styles.proposalInfo}>
                  <Text style={styles.proposalTitle}>{proposal.artista_nome}</Text>
                  <Text style={styles.proposalSubtitle}>
                    {formatDateTime(proposal.data_evento)}
                  </Text>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                  <Text style={styles.statusText}>
                    {getProposalStatusLabel(proposal.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma proposta enviada.</Text>
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View style={styles.sectionHeaderNoMargin}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Calendario de eventos do mes</Text>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Com evento</Text>
            </View>
          </View>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[dashboard.month - 1]} de {dashboard.year}
          </Text>

          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.weekLabel}>
                {day}
              </Text>
            ))}
          </View>

          {calendarWeeks.map((week, index) => (
            <View key={`week-${index}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                const hasEvent = day && dashboard.daysWithEvents.includes(day);
                const isSelected = day === selectedDay;

                if (!day) {
                  return <View key={`${index}-${dayIndex}`} style={styles.dayCellEmpty} />;
                }

                return (
                  <TouchableOpacity
                    key={`${index}-${dayIndex}`}
                    activeOpacity={0.85}
                    style={[
                      styles.dayCell,
                      hasEvent && styles.dayCellWithEvent,
                      isSelected && styles.dayCellSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        hasEvent && styles.dayTextWithEvent,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.selectedEventsContainer}>
            <Text style={styles.selectedEventsTitle}>
              Eventos do dia {selectedDay || '--'}
            </Text>

            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((eventItem) => (
                <View key={getEventId(eventItem)} style={styles.selectedEventCard}>
                  <View style={styles.selectedEventLeft}>
                    <Text style={styles.selectedEventName}>{eventItem.titulo}</Text>
                    <Text style={styles.selectedEventMeta}>
                      {formatTimeOnly(eventItem.data_inicio)} - {eventItem.local}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle('Confirmado')]}>
                    <Text style={styles.statusText}>Confirmado</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Nenhum evento cadastrado para este dia.
              </Text>
            )}
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
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
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroSecondaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  eventsShortcutCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.small,
  },
  eventsShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  eventsShortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventsShortcutTextBox: {
    flex: 1,
  },
  eventsShortcutTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventsShortcutSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  statSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  infoCard: {
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
  sectionHeaderNoMargin: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  nextEventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nextEventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextEventTextBox: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nextEventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 6,
  },
  nextEventText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addProposalButton: {
    minHeight: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProposalButtonText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  detailGrid: {
    gap: spacing.sm,
  },
  detailItemFull: {
    width: '100%',
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 6,
  },
  detailValue: {
    ...typography.bodySmall,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  proposalInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  proposalTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  proposalSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
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
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.small,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F97316',
    marginRight: 6,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  monthTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  weekLabel: {
    width: '13.5%',
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayCell: {
    width: '13.5%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: '#1A2742',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellEmpty: {
    width: '13.5%',
    aspectRatio: 1,
  },
  dayCellWithEvent: {
    borderColor: '#F97316',
  },
  dayCellSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
  },
  dayText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  dayTextWithEvent: {
    color: '#F97316',
  },
  dayTextSelected: {
    color: colors.text,
  },
  selectedEventsContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedEventsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  selectedEventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  selectedEventLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedEventName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedEventMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
