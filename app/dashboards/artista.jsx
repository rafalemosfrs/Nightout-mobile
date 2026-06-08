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
import { eventService, proposalService, usersService } from '../../services/api';
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
  return ['PENDENTE', 'ENVIADA', 'ABERTA', 'DISPONIVEL', 'DISPONÍVEL'].includes(
    normalizeStatus(status)
  );
}

function isRejected(status) {
  return ['RECUSADA', 'RECUSADO', 'CANCELADA', 'CANCELADO'].includes(
    normalizeStatus(status)
  );
}

function getProposalId(item) {
  return (
    item?.id_proposta_casa ||
    item?.id_proposta ||
    item?.idPropostaCasa ||
    item?.id ||
    item?.uuid
  );
}

function getProposalEventId(item) {
  return (
    item?.id_evento ||
    item?.idEvento ||
    item?.evento?.id_evento ||
    item?.evento?.id ||
    item?.Evento?.id_evento ||
    item?.Evento?.id ||
    ''
  );
}

function getProposalCasaId(item) {
  return (
    item?.id_casa_show ||
    item?.idCasaShow ||
    item?.casaDeShow?.id_usuario ||
    item?.casaDeShow?.id ||
    item?.CasaDeShow?.id_usuario ||
    item?.CasaDeShow?.id ||
    item?.casa?.id_usuario ||
    item?.casa?.id ||
    item?.evento?.id_casa_show ||
    item?.evento?.id_usuario ||
    item?.Evento?.id_casa_show ||
    item?.Evento?.id_usuario ||
    ''
  );
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

function getEventoTitle(evento) {
  return evento?.titulo || evento?.nome_evento || '';
}

function getEventoLocal(evento) {
  return evento?.local || evento?.endereco || '';
}

function getEventoDate(evento) {
  return evento?.data_inicio || evento?.data_evento || '';
}

function getCasaName(casa) {
  return (
    casa?.nome_fantasia ||
    casa?.nome ||
    casa?.usuario?.nome ||
    casa?.email ||
    casa?.usuario?.email ||
    ''
  );
}

function getCasaNameFromProposal(item) {
  return (
    item?.casa_nome ||
    item?.nome_casa ||
    item?.casa_show_nome ||
    item?.casaDeShow?.nome_fantasia ||
    item?.casaDeShow?.nome ||
    item?.casaDeShow?.usuario?.nome ||
    item?.CasaDeShow?.nome_fantasia ||
    item?.CasaDeShow?.nome ||
    item?.CasaDeShow?.usuario?.nome ||
    item?.casa?.nome_fantasia ||
    item?.casa?.nome ||
    item?.casa?.usuario?.nome ||
    ''
  );
}

function getEventFromProposal(item) {
  return item?.evento || item?.Evento || item?.event || {};
}

function getCasaFromProposal(item) {
  return item?.casaDeShow || item?.CasaDeShow || item?.casa || {};
}

function normalizeProposal(item) {
  const evento = getEventFromProposal(item);
  const casa = getCasaFromProposal(item);
  const date =
    item?.data_evento ||
    item?.dataEvento ||
    getEventoDate(evento) ||
    item?.data_inicio ||
    '';

  return {
    raw: item,
    id: getProposalId(item),
    id_evento: getProposalEventId(item),
    id_casa_show: getProposalCasaId(item),
    title:
      getEventoTitle(evento) ||
      item?.evento_titulo ||
      item?.nome_evento ||
      item?.titulo ||
      'Proposta recebida',
    houseName:
      getCasaName(casa) ||
      getCasaNameFromProposal(item) ||
      'Casa de show',
    address:
      getEventoLocal(evento) ||
      item?.evento_local ||
      item?.local_evento ||
      item?.local ||
      item?.endereco ||
      'Local nao informado',
    date,
    status: normalizeStatus(item?.status),
    value: Number(item?.valor_ofertado || item?.valorOfertado || item?.valor || 0),
    terms: item?.termos || '',
  };
}

async function enrichProposal(item) {
  const normalized = normalizeProposal(item);

  const [eventResult, casaResult] = await Promise.allSettled([
    normalized.id_evento
      ? eventService.getById(normalized.id_evento)
      : Promise.resolve(null),
    normalized.id_casa_show
      ? usersService.getCasaShow(normalized.id_casa_show)
      : Promise.resolve(null),
  ]);

  const evento =
    eventResult.status === 'fulfilled' && eventResult.value
      ? eventResult.value
      : null;

  const casa =
    casaResult.status === 'fulfilled' && casaResult.value
      ? casaResult.value
      : null;

  const eventCasaId =
    evento?.id_casa_show ||
    evento?.id_usuario ||
    evento?.casaDeShow?.id_usuario ||
    evento?.casaDeShow?.id ||
    '';

  let finalCasa = casa;

  if (!finalCasa && eventCasaId) {
    try {
      finalCasa = await usersService.getCasaShow(eventCasaId);
    } catch (requestError) {
      console.log('ERRO AO BUSCAR CASA PELO EVENTO:', requestError);
    }
  }

  return {
    ...normalized,
    evento,
    casaDeShow: finalCasa,
    title:
      getEventoTitle(evento) ||
      normalized.title ||
      'Proposta recebida',
    houseName:
      getCasaName(finalCasa) ||
      normalized.houseName ||
      'Casa de show',
    address:
      getEventoLocal(evento) ||
      normalized.address ||
      'Local nao informado',
    date:
      normalized.date ||
      getEventoDate(evento) ||
      '',
  };
}

function getStatusStyle(status) {
  if (isAccepted(status)) return styles.statusSuccess;
  if (isPending(status)) return styles.statusPending;
  return styles.statusDanger;
}

function getStatusIcon(status) {
  if (isAccepted(status)) return 'checkmark-circle-outline';
  if (isPending(status)) return 'time-outline';
  return 'close-circle-outline';
}

function getStatusLabel(status) {
  if (isAccepted(status)) return 'Aceita';
  if (isPending(status)) return 'Pendente';
  if (isRejected(status)) return 'Recusada';
  return normalizeStatus(status);
}

export default function ArtistDashboardScreen() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [selectedCalendarProposalId, setSelectedCalendarProposalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const artistId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadProposals = useCallback(async () => {
    if (!artistId) {
      setError('Sessão inválida.');
      setProposals([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');

      console.log('ARTISTA ID USADO NA DASHBOARD:', artistId);

      const response = await proposalService.listByArtist(artistId);

      console.log('PROPOSTAS DO ARTISTA - API:', JSON.stringify(response, null, 2));

      const proposalList = Array.isArray(response) ? response : [];

      const enriched = await Promise.all(
        proposalList.map((proposal) => enrichProposal(proposal))
      );

      console.log('PROPOSTAS DO ARTISTA - ENRIQUECIDAS:', JSON.stringify(enriched, null, 2));

      setProposals(enriched);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR DASHBOARD DO ARTISTA:', requestError);

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

  const summary = useMemo(() => {
    const accepted = proposals.filter((item) => isAccepted(item.status));
    const pending = proposals.filter((item) => isPending(item.status));

    const acceptedCalendarItems = accepted
      .filter((item) => Boolean(item.date))
      .sort((a, b) => {
        const dateA = parseDate(a.date)?.getTime() || 0;
        const dateB = parseDate(b.date)?.getTime() || 0;
        return dateA - dateB;
      })
      .slice(0, 8);

    return {
      accepted,
      pending,
      acceptedCount: accepted.length,
      pendingCount: pending.length,
      acceptedTotal: accepted.reduce((sum, item) => sum + Number(item.value || 0), 0),
      confirmedShowsCount: accepted.length,
      acceptedCalendarItems,
    };
  }, [proposals]);

  const selectedCalendarProposal = useMemo(() => {
    if (!summary.acceptedCalendarItems.length) return null;

    return (
      summary.acceptedCalendarItems.find(
        (item) => item.id === selectedCalendarProposalId
      ) || summary.acceptedCalendarItems[0]
    );
  }, [selectedCalendarProposalId, summary.acceptedCalendarItems]);

  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => {
      const dateA = parseDate(a.date)?.getTime() || 0;
      const dateB = parseDate(b.date)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [proposals]);

  const confirmedShows = useMemo(() => {
    return summary.accepted
      .slice()
      .sort((a, b) => {
        const dateA = parseDate(a.date)?.getTime() || 0;
        const dateB = parseDate(b.date)?.getTime() || 0;
        return dateA - dateB;
      });
  }, [summary.accepted]);

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

      const normalizedStatus = normalizeStatus(status);

      setProposals((current) =>
        current.map((item) =>
          item.id === proposal.id
            ? { ...item, status: normalizedStatus }
            : item
        )
      );

      if (isAccepted(normalizedStatus)) {
        setSelectedCalendarProposalId(proposal.id);
      }
    } catch (requestError) {
      Alert.alert(
        'Erro',
        requestError?.message || 'Nao foi possivel atualizar a proposta.'
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

        <TouchableOpacity
          style={styles.listCard}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          onPress={() => void router.push('/dashboards/artista/propostas')}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="playlist-music"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Propostas do artista</Text>
          </View>

          <Text style={styles.listCardText}>
            Abra a lista completa de propostas do artista.
          </Text>
        </TouchableOpacity>

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

            <Text style={styles.statTitle}>Valor confirmado</Text>

            <Text style={[styles.statValue, styles.valueGreen]}>
              {formatCurrency(summary.acceptedTotal)}
            </Text>

            <Text style={styles.statDescription}>
              {summary.acceptedCount} negociações aceitas
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
              {summary.confirmedShowsCount}
            </Text>

            <Text style={styles.statDescription}>Propostas aceitas</Text>
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

            <Text style={styles.statDescription}>Histórico recebido</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Mini calendário</Text>
          </View>

          {summary.acceptedCalendarItems.length > 0 ? (
            <>
              <View style={styles.calendarGrid}>
                {summary.acceptedCalendarItems.map((proposal) => {
                  const badge = formatDateBadge(proposal.date);
                  const isSelected = selectedCalendarProposal?.id === proposal.id;

                  return (
                    <TouchableOpacity
                      key={`${proposal.id}-${proposal.date}`}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedCalendarProposalId(proposal.id)}
                    >
                      <Text
                        style={[
                          styles.calendarMonth,
                          isSelected && styles.calendarMonthSelected,
                        ]}
                      >
                        {badge.month}
                      </Text>

                      <Text style={styles.calendarDate}>{badge.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedCalendarProposal ? (
                <View style={styles.calendarDetailsBox}>
                  <View style={styles.calendarDetailsHeader}>
                    <Ionicons name="ticket-outline" size={16} color={colors.primary} />
                    <Text style={styles.calendarDetailsTitle}>
                      {selectedCalendarProposal.title}
                    </Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.calendarDetailsText}>
                      {selectedCalendarProposal.houseName}
                    </Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.calendarDetailsText}>
                      {selectedCalendarProposal.address}
                    </Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.calendarDetailsText}>
                      {formatDateTime(selectedCalendarProposal.date)}
                    </Text>
                  </View>

                  <View style={styles.inlineRow}>
                    <Ionicons name="cash-outline" size={14} color="#19D38A" />
                    <Text style={styles.calendarDetailsValue}>
                      {formatCurrency(selectedCalendarProposal.value)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>
              Datas aceitas aparecerao aqui assim que uma proposta for aprovada.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Shows confirmados</Text>
          </View>

          {confirmedShows.length > 0 ? (
            confirmedShows.slice(0, 5).map((proposal) => {
              const badge = formatDateBadge(proposal.date);

              return (
                <View key={proposal.id} style={styles.proposalCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{badge.month}</Text>
                    <Text style={styles.dateDay}>{badge.day}</Text>
                  </View>

                  <View style={styles.proposalContent}>
                    <View style={styles.proposalHeader}>
                      <Text style={styles.proposalTitle}>{proposal.title}</Text>

                      <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                        <Ionicons
                          name={getStatusIcon(proposal.status)}
                          size={13}
                          color={colors.text}
                        />
                        <Text style={styles.statusText}>
                          {getStatusLabel(proposal.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.proposalHouse}>{proposal.houseName}</Text>

                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.proposalMeta}>
                        {formatDateTime(proposal.date)}
                      </Text>
                    </View>

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
                        <Ionicons name="cash-outline" size={15} color="#19D38A" />
                        <Text style={styles.proposalValue}>
                          {formatCurrency(proposal.value)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              Quando você aceitar uma proposta, o show confirmado aparecerá aqui.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="mail-unread-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Propostas recentes</Text>
          </View>

          {sortedProposals.length > 0 ? (
            sortedProposals.slice(0, 5).map((proposal) => {
              const badge = formatDateBadge(proposal.date);
              const updating = updatingId === proposal.id;
              const pending = isPending(proposal.status);

              return (
                <View key={proposal.id} style={styles.proposalCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{badge.month}</Text>
                    <Text style={styles.dateDay}>{badge.day}</Text>
                  </View>

                  <View style={styles.proposalContent}>
                    <View style={styles.proposalHeader}>
                      <Text style={styles.proposalTitle}>{proposal.title}</Text>

                      <View style={[styles.statusBadge, getStatusStyle(proposal.status)]}>
                        <Ionicons
                          name={getStatusIcon(proposal.status)}
                          size={13}
                          color={colors.text}
                        />
                        <Text style={styles.statusText}>
                          {getStatusLabel(proposal.status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.proposalHouse}>{proposal.houseName}</Text>

                    <View style={styles.inlineRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.proposalMeta}>
                        {formatDateTime(proposal.date)}
                      </Text>
                    </View>

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
                        <Ionicons name="cash-outline" size={15} color="#19D38A" />
                        <Text style={styles.proposalValue}>
                          {formatCurrency(proposal.value)}
                        </Text>
                      </View>
                    </View>

                    {pending ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[
                            styles.proposalActionButton,
                            styles.acceptButton,
                            updating && styles.disabledButton,
                          ]}
                          activeOpacity={0.85}
                          disabled={updating}
                          onPress={() => handleProposalAction(proposal, 'ACEITA')}
                        >
                          <Text style={styles.proposalActionText}>
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
                          onPress={() => handleProposalAction(proposal, 'RECUSADA')}
                        >
                          <Text style={styles.proposalActionText}>
                            {updating ? 'Salvando...' : 'Recusar'}
                          </Text>
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
                name="playlist-remove"
                size={46}
                color={colors.textMuted}
              />
              <Text style={styles.emptyStateTitle}>Nenhuma proposta recebida</Text>
              <Text style={styles.emptyStateText}>
                Quando uma casa enviar proposta, ela aparecerá aqui.
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
  listCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  listCardText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
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
  calendarDaySelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.18)',
    borderColor: colors.secondary,
  },
  calendarMonth: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  calendarMonthSelected: {
    color: colors.secondary,
  },
  calendarDate: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
  },
  calendarDetailsBox: {
    marginTop: spacing.md,
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  calendarDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  calendarDetailsTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
  },
  calendarDetailsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  calendarDetailsValue: {
    ...typography.bodySmall,
    color: '#19D38A',
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
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
  disabledButton: {
    opacity: 0.6,
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
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