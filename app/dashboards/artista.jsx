import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const dashboardMock = {
  artista: {
    id: 'artista-id-aqui',
    nome: 'Du e Bielzin',
    genero: 'Forró',
    cidade: 'Fortaleza, CE',
    avatarLabel: 'DB',
  },
  resumo: {
    saldoMes: 0,
    showsMes: 0,
    proximosEventos: 3,
    totalAcumulado: 416005.08,
  },
  saldoUltimosMeses: [
    { mes: 'SET.', valor: 0 },
    { mes: 'OUT.', valor: 0 },
    { mes: 'NOV.', valor: 5.08 },
    { mes: 'DEZ.', valor: 416000 },
    { mes: 'JAN.', valor: 0 },
    { mes: 'FEV.', valor: 0 },
  ],
  showsUltimosMeses: [
    { mes: 'S', quantidade: 0 },
    { mes: 'O', quantidade: 0 },
    { mes: 'N', quantidade: 2 },
    { mes: 'D', quantidade: 6 },
    { mes: 'J', quantidade: 0 },
    { mes: 'F', quantidade: 0 },
  ],
  proximosEventos: [
    {
      id: 'evt-1',
      data: '24 NOV',
      titulo: 'Terapia sem fim com Nattan',
      local: 'Av. Bezerra de Menezes',
      hora: '22:21',
      cache: 5,
      status: 'Confirmado',
    },
    {
      id: 'evt-2',
      data: '25 NOV',
      titulo: 'Festa',
      local: 'Rua PI',
      hora: '00:20',
      cache: 0.08,
      status: 'Pendente',
    },
    {
      id: 'evt-3',
      data: '30 NOV',
      titulo: 'Tech Du e Biel',
      local: 'Av. Washington Soares',
      hora: '23:59',
      cache: 30000,
      status: 'Confirmado',
    },
  ],
  estabelecimentosRecentes: [
    {
      id: 'venue-1',
      nome: 'Living',
      nota: 4.8,
    },
  ],
  propostasRecentes: [
    {
      id: 'prop-1',
      titulo: 'Proposta Casa Living',
      valor: 15000,
      status: 'PENDENTE',
    },
    {
      id: 'prop-2',
      titulo: 'Proposta Festival Beira Mar',
      valor: 18000,
      status: 'ACEITA',
    },
  ],
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function getMaxSaldo(items) {
  return Math.max(...items.map((item) => item.valor), 1);
}

function getMaxShows(items) {
  return Math.max(...items.map((item) => item.quantidade), 1);
}

function getStatusStyle(status) {
  switch (status) {
    case 'ACEITA':
    case 'Confirmado':
      return styles.statusSuccess;
    case 'PENDENTE':
    case 'Pendente':
      return styles.statusPending;
    default:
      return styles.statusDefault;
  }
}

function getAvatarLabel(nome) {
  if (!nome) return 'AR';
  const partes = nome.trim().split(' ').filter(Boolean);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

export default function ArtistDashboardScreen() {
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const stored = await AsyncStorage.getItem('user_session');
        if (stored) {
          setSessionUser(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Erro ao carregar sessão', error);
      }
    }

    loadSession();
  }, []);

  const data = useMemo(() => {
    const nomeFinal = sessionUser?.nome || dashboardMock.artista.nome;

    return {
      ...dashboardMock,
      artista: {
        ...dashboardMock.artista,
        nome: nomeFinal,
        avatarLabel: getAvatarLabel(nomeFinal),
      },
    };
  }, [sessionUser]);

  const maxSaldo = getMaxSaldo(data.saldoUltimosMeses);
  const maxShows = getMaxShows(data.showsUltimosMeses);

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

          <Text style={styles.topBarTitle}>Dashboard do Artista</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{data.artista.avatarLabel}</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.artistName}>{data.artista.nome}</Text>

            <View style={styles.inlineRow}>
              <MaterialCommunityIcons
                name="music-note"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.heroMeta}>{data.artista.genero}</Text>
            </View>

            <View style={styles.inlineRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.heroMetaSecondary}>{data.artista.cidade}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
            <Text style={styles.actionButtonText}>Agenda</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={18} color={colors.text} />
            <Text style={styles.actionButtonText}>Propostas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconGreen}>
              <Ionicons name="cash-outline" size={18} color="#19D38A" />
            </View>
            <Text style={styles.statTitle}>Saldo do mês</Text>
            <Text style={[styles.statValue, styles.valueGreen]}>
              {formatCurrency(data.resumo.saldoMes)}
            </Text>
            <Text style={styles.statDescription}>Propostas aceitas no mês</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconBlue}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statTitle}>Shows</Text>
            <Text style={[styles.statValue, styles.valueBlue]}>
              {data.resumo.showsMes}
            </Text>
            <Text style={styles.statDescription}>Shows confirmados no mês</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconPurple}>
              <MaterialCommunityIcons
                name="music-note-outline"
                size={18}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.statTitle}>Próximos eventos</Text>
            <Text style={[styles.statValue, styles.valuePurple]}>
              {data.resumo.proximosEventos}
            </Text>
            <Text style={styles.statDescription}>Agenda confirmada</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconOrange}>
              <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.statTitle}>Total acumulado</Text>
            <Text style={[styles.statValue, styles.valueOrange]}>
              {formatCurrency(data.resumo.totalAcumulado)}
            </Text>
            <Text style={styles.statDescription}>Valor total recebido</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={18} color="#19D38A" />
            <Text style={styles.sectionTitle}>Saldo dos últimos 6 meses</Text>
          </View>

          {data.saldoUltimosMeses.map((item) => {
            const widthPercent = `${Math.max((item.valor / maxSaldo) * 100, item.valor > 0 ? 6 : 0)}%`;

            return (
              <View key={item.mes} style={styles.balanceRow}>
                <View style={styles.balanceTopRow}>
                  <Text style={styles.balanceMonth}>{item.mes}</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(item.valor)}</Text>
                </View>

                <View style={styles.balanceTrack}>
                  <View style={[styles.balanceBar, { width: widthPercent }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shows dos últimos 6 meses</Text>
          </View>

          <View style={styles.chartArea}>
            {data.showsUltimosMeses.map((item) => {
              const height = `${Math.max((item.quantidade / maxShows) * 100, item.quantidade > 0 ? 8 : 3)}%`;

              return (
                <View key={item.mes} style={styles.chartColumn}>
                  <Text style={styles.chartValue}>
                    {item.quantidade > 0 ? item.quantidade : ''}
                  </Text>
                  <View style={styles.chartTrack}>
                    <View style={[styles.chartBar, { height }]} />
                  </View>
                  <Text style={styles.chartLabel}>{item.mes}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Próximos eventos</Text>
          </View>

          {data.proximosEventos.map((evento) => (
            <View key={evento.id} style={styles.eventCard}>
              <View style={styles.eventDateBox}>
                <Text style={styles.eventDateText}>{evento.data}</Text>
              </View>

              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{evento.titulo}</Text>

                <View style={styles.inlineRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.eventMeta}>{evento.local}</Text>
                </View>

                <View style={styles.eventFooter}>
                  <View style={styles.inlineRow}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.eventMeta}>{evento.hora}</Text>
                  </View>

                  <Text style={styles.eventCache}>{formatCurrency(evento.cache)}</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, getStatusStyle(evento.status)]}>
                <Text style={styles.statusText}>{evento.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={18}
              color={colors.secondary}
            />
            <Text style={styles.sectionTitle}>Estabelecimentos recentes</Text>
          </View>

          {data.estabelecimentosRecentes.map((item) => (
            <View key={item.id} style={styles.venueCard}>
              <View style={styles.venueIcon}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={20}
                  color={colors.secondary}
                />
              </View>

              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{item.nome}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.nota}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Propostas recentes</Text>
          </View>

          {data.propostasRecentes.map((proposta) => (
            <View key={proposta.id} style={styles.proposalCard}>
              <View style={styles.proposalInfo}>
                <Text style={styles.proposalTitle}>{proposta.titulo}</Text>
                <Text style={styles.proposalValue}>
                  {formatCurrency(proposta.valor)}
                </Text>
              </View>

              <View style={[styles.statusBadge, getStatusStyle(proposta.status)]}>
                <Text style={styles.statusText}>{proposta.status}</Text>
              </View>
            </View>
          ))}
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
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
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
    fontSize: 28,
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
  balanceRow: {
    marginBottom: spacing.md,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceMonth: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  balanceValue: {
    ...typography.bodySmall,
    color: '#19D38A',
    fontWeight: '700',
  },
  balanceTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  balanceBar: {
    height: '100%',
    backgroundColor: '#19D38A',
    borderRadius: borderRadius.full,
  },
  chartArea: {
    height: 220,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  chartColumn: {
    width: '14%',
    alignItems: 'center',
  },
  chartValue: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 6,
    minHeight: 16,
  },
  chartTrack: {
    width: '100%',
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '80%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    minHeight: 4,
  },
  chartLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 10,
    fontWeight: '700',
  },
  eventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventDateBox: {
    width: 58,
    minHeight: 58,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  eventDateText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventMeta: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  eventCache: {
    ...typography.bodySmall,
    color: '#19D38A',
    fontWeight: '700',
  },
  venueCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(157, 78, 221, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  ratingText: {
    ...typography.caption,
    color: '#F59E0B',
    fontWeight: '700',
  },
  proposalCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  proposalValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
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
  statusDefault: {
    backgroundColor: 'rgba(160, 174, 192, 0.14)',
  },
  statusText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
});