import React, { useEffect, useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getCasaShowDashboardRequest } from '../../services/api';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const USE_MOCK = false;

const WEEK_DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
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

const casaDeShowMock = {
  id_usuario: 'casa-show-001',
  nome_fantasia: 'Living Music Hall',
  cnpj: '12.345.678/0001-90',
  capacidade: '1200',
  endereco: 'Av. Beira Mar, 1200',
  bairro: 'Meireles',
  estado: 'CE',
  cep: '60165-121',
  geo_lat: '-3.7319',
  geo_lng: '-38.5267',
  usuario: {
    nome: 'Living Entretenimento',
    email: 'contato@living.com',
    telefone: '+55 85 99999-0000',
    tipo: 'CASASHOW',
  },
};

const dashboardUiMock = {
  resumo: {
    eventosCasa: 12,
    proximosEventos: 4,
    propostasEnviadas: 9,
    propostasAceitas: 5,
  },
  proximoEvento: {
    id: 'evt-next-1',
    titulo: 'Noite do Piseiro',
    data: '24 de Fevereiro • 22:00',
    local: 'Av. Beira Mar, 1200 • Meireles',
  },
  propostasCasa: [
    {
      id: 'prop-1',
      artista: 'Du e Bielzin',
      data: '24/02/2026',
      status: 'Aceita',
    },
    {
      id: 'prop-2',
      artista: 'DJ Mari',
      data: '27/02/2026',
      status: 'Pendente',
    },
    {
      id: 'prop-3',
      artista: 'Forró Vybbe',
      data: '03/03/2026',
      status: 'Pendente',
    },
  ],
  calendario: {
    mes: 2,
    ano: 2026,
    diaSelecionado: 24,
    diasComEvento: [7, 14, 24, 27],
    eventosPorDia: {
      7: [
        {
          id: 'cal-7-1',
          titulo: 'Sexta do Trap',
          horario: '21:30',
          artista: 'MC A7',
          status: 'Confirmado',
        },
      ],
      14: [
        {
          id: 'cal-14-1',
          titulo: 'Especial Carnaval',
          horario: '23:00',
          artista: 'Banda Swing Total',
          status: 'Confirmado',
        },
        {
          id: 'cal-14-2',
          titulo: 'After Open Format',
          horario: '02:00',
          artista: 'DJ Gabi',
          status: 'Confirmado',
        },
      ],
      24: [
        {
          id: 'cal-24-1',
          titulo: 'Noite do Piseiro',
          horario: '22:00',
          artista: 'Du e Bielzin',
          status: 'Confirmado',
        },
        {
          id: 'cal-24-2',
          titulo: 'Aquecimento do Evento',
          horario: '20:30',
          artista: 'DJ Nanda',
          status: 'Confirmado',
        },
      ],
      27: [
        {
          id: 'cal-27-1',
          titulo: 'Baile Funk Premium',
          horario: '23:30',
          artista: 'DJ Mari',
          status: 'Pendente',
        },
      ],
    },
  },
};

function normalizeCasaDeShowPayload(payload = {}) {
  return {
    id_usuario: payload?.id_usuario || '',
    nome_fantasia: payload?.nome_fantasia || '',
    cnpj: payload?.cnpj || '',
    capacidade: payload?.capacidade || '',
    endereco: payload?.endereco || '',
    bairro: payload?.bairro || '',
    estado: payload?.estado || '',
    cep: payload?.cep || '',
    geo_lat: payload?.geo_lat || '',
    geo_lng: payload?.geo_lng || '',
    usuario: {
      nome: payload?.usuario?.nome || '',
      email: payload?.usuario?.email || '',
      telefone: payload?.usuario?.telefone || '',
      tipo: payload?.usuario?.tipo || 'CASASHOW',
    },
  };
}

function buildDashboardData(apiPayload) {
  const casa = normalizeCasaDeShowPayload(apiPayload?.casa || apiPayload);

  return {
    casa,
    resumo: apiPayload?.resumo || dashboardUiMock.resumo,
    proximoEvento: apiPayload?.proximoEvento || dashboardUiMock.proximoEvento,
    propostasCasa: apiPayload?.propostasCasa || dashboardUiMock.propostasCasa,
    calendario: apiPayload?.calendario || dashboardUiMock.calendario,
  };
}

async function getCasaShowDashboardData(token) {
  if (USE_MOCK) {
    return buildDashboardData(casaDeShowMock);
  }

  if (!token) throw new Error("Token não fornecido");
  const response = await getCasaShowDashboardRequest(token);
  return buildDashboardData(response);
}

function buildCalendarMatrix(month, year) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();

  const weeks = [];
  let currentDay = 1 - firstDayOfMonth;

  while (currentDay <= totalDays) {
    const week = [];

    for (let i = 0; i < 7; i += 1) {
      if (currentDay < 1 || currentDay > totalDays) {
        week.push(null);
      } else {
        week.push(currentDay);
      }

      currentDay += 1;
    }

    weeks.push(week);
  }

  return weeks;
}

function getStatusStyle(status) {
  return status === 'Aceita' || status === 'Confirmado'
    ? styles.statusSuccess
    : styles.statusPending;
}

export default function CasaShowDashboardScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const stored = await AsyncStorage.getItem('user_session');
        if (!stored) throw new Error('Sessão não encontrada');
        
        const session = JSON.parse(stored);
        const data = await getCasaShowDashboardData(session.token);
        
        setDashboard(data);
        setSelectedDay(data?.calendario?.diaSelecionado || null);
      } catch (error) {
        console.log('Erro ao carregar dashboard da casa de show:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const calendarWeeks = useMemo(() => {
    if (!dashboard) return [];
    return buildCalendarMatrix(dashboard.calendario.mes, dashboard.calendario.ano);
  }, [dashboard]);

  const selectedDayEvents = useMemo(() => {
    if (!dashboard || !selectedDay) return [];
    return dashboard.calendario.eventosPorDia?.[selectedDay] || [];
  }, [dashboard, selectedDay]);

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

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Não foi possível carregar a dashboard.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { casa } = dashboard;

  const summaryCards = [
    {
      title: 'Eventos da casa',
      value: dashboard.resumo.eventosCasa,
      subtitle: 'Total cadastrado',
      icon: 'calendar-outline',
    },
    {
      title: 'Próximos eventos',
      value: dashboard.resumo.proximosEventos,
      subtitle: 'Agenda futura',
      icon: 'time-outline',
    },
    {
      title: 'Propostas enviadas',
      value: dashboard.resumo.propostasEnviadas,
      subtitle: 'Aguardando retorno',
      icon: 'paper-plane-outline',
    },
    {
      title: 'Propostas aceitas',
      value: dashboard.resumo.propostasAceitas,
      subtitle: 'Negociações fechadas',
      icon: 'checkmark-circle-outline',
    },
  ];

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
            onPress={() => router.push('/')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Dashboard Casa de Show</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons
              name="office-building"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{casa.nome_fantasia || 'Casa de Show'}</Text>
            <Text style={styles.heroSubtitle}>{casa.usuario.tipo}</Text>
            <Text style={styles.heroSecondaryText}>
              {casa.bairro} • {casa.estado}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.eventsShortcutCard}
          activeOpacity={0.85}
          onPress={() => router.push('/events')}
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
          {summaryCards.map((card) => (
            <View key={card.title} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{card.title}</Text>
                <View style={styles.statIcon}>
                  <Ionicons name={card.icon} size={18} color={colors.primary} />
                </View>
              </View>

              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statSubtitle}>{card.subtitle}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Dados da casa</Text>
          </View>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ID do usuário</Text>
              <Text style={styles.detailValue}>{casa.id_usuario}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nome fantasia</Text>
              <Text style={styles.detailValue}>{casa.nome_fantasia}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Responsável</Text>
              <Text style={styles.detailValue}>{casa.usuario.nome}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{casa.usuario.email}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Telefone</Text>
              <Text style={styles.detailValue}>
                {casa.usuario.telefone || 'Não informado'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CNPJ</Text>
              <Text style={styles.detailValue}>{casa.cnpj}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Capacidade</Text>
              <Text style={styles.detailValue}>{casa.capacidade} pessoas</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>CEP</Text>
              <Text style={styles.detailValue}>{casa.cep}</Text>
            </View>

            <View style={styles.detailItemFull}>
              <Text style={styles.detailLabel}>Endereço</Text>
              <Text style={styles.detailValue}>
                {casa.endereco}, {casa.bairro} - {casa.estado}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Latitude</Text>
              <Text style={styles.detailValue}>{casa.geo_lat}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Longitude</Text>
              <Text style={styles.detailValue}>{casa.geo_lng}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Próximo evento da casa</Text>
          </View>

          {dashboard.proximoEvento ? (
            <View style={styles.nextEventCard}>
              <Text style={styles.nextEventTitle}>{dashboard.proximoEvento.titulo}</Text>
              <Text style={styles.nextEventText}>{dashboard.proximoEvento.data}</Text>
              <Text style={styles.nextEventText}>{dashboard.proximoEvento.local}</Text>
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

          {dashboard.propostasCasa.length > 0 ? (
            dashboard.propostasCasa.map((proposta) => (
              <View key={proposta.id} style={styles.proposalCard}>
                <View style={styles.proposalInfo}>
                  <Text style={styles.proposalTitle}>{proposta.artista}</Text>
                  <Text style={styles.proposalSubtitle}>{proposta.data}</Text>
                </View>

                <View style={[styles.statusBadge, getStatusStyle(proposta.status)]}>
                  <Text style={styles.statusText}>{proposta.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma proposta.</Text>
          )}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View style={styles.sectionHeaderNoMargin}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Calendário de eventos do mês</Text>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Com evento</Text>
            </View>
          </View>

          <Text style={styles.monthTitle}>
            {MONTH_NAMES[dashboard.calendario.mes - 1]} de {dashboard.calendario.ano}
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
                const hasEvent = day && dashboard.calendario.diasComEvento.includes(day);
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
              selectedDayEvents.map((evento) => (
                <View key={evento.id} style={styles.selectedEventCard}>
                  <View style={styles.selectedEventLeft}>
                    <Text style={styles.selectedEventName}>{evento.titulo}</Text>
                    <Text style={styles.selectedEventMeta}>
                      {evento.horario} • {evento.artista}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle(evento.status)]}>
                    <Text style={styles.statusText}>{evento.status}</Text>
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
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
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
  nextEventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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