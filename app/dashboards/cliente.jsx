import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/api';
import {
  formatDateOnly,
  formatDateTime,
  getEventId,
  normalizeEvent,
  parseApiDate,
} from '../../utils/casaShowData';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const FALLBACK_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80';

function getAvatarLetter(nome) {
  if (!nome || typeof nome !== 'string') return 'C';
  return nome.trim().charAt(0).toUpperCase() || 'C';
}

function formatMonthBadge(value) {
  const date = parseApiDate(value);

  if (!date) {
    return {
      month: '--',
      day: '--',
    };
  }

  return {
    month: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
      .format(date)
      .replace('.', '')
      .toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

export default function ClientDashboardScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setError('');
      const response = await eventService.list({ page: 1, pageSize: 20 });
      setEvents(Array.isArray(response) ? response.map(normalizeEvent) : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar eventos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const dashboard = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
      const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;
      return dateA - dateB;
    });

    const now = Date.now();
    const upcomingEvents = sortedEvents.filter((eventItem) => {
      const date = parseApiDate(eventItem.data_inicio);
      return date ? date.getTime() >= now : true;
    });

    return {
      highlighted: upcomingEvents.slice(0, 3),
      mainEvent: upcomingEvents[0] || sortedEvents[0] || null,
      recent: sortedEvents.slice(0, 4),
    };
  }, [events]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
  }

  const nome = session?.nome || 'Cliente';

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

          <Text style={styles.topBarTitle}>Dashboard do Cliente</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarLetter(nome)}</Text>
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Ola, {nome}!</Text>

            <Text style={styles.heroSubtitle}>
              Descubra eventos carregados direto da API.
            </Text>

            <Text style={styles.heroLocation}>{session?.email}</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadEvents}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/events')}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Eventos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Eventos em destaque</Text>

          {dashboard.highlighted.length > 0 ? (
            <View style={styles.highlightRow}>
              {dashboard.highlighted.map((eventItem) => {
                const badge = formatMonthBadge(eventItem.data_inicio);

                return (
                  <TouchableOpacity
                    key={getEventId(eventItem)}
                    style={styles.highlightItem}
                    activeOpacity={0.85}
                    onPress={() => router.push('/(tabs)/events')}
                  >
                    <Image
                      source={{ uri: eventItem.foto_evento || FALLBACK_EVENT_IMAGE }}
                      style={styles.highlightImage}
                    />
                    <Text style={styles.highlightTitle} numberOfLines={1}>
                      {eventItem.titulo}
                    </Text>
                    <Text style={styles.highlightDate}>
                      {badge.day} {badge.month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento retornado pela API.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proximo evento</Text>

          {dashboard.mainEvent ? (
            <TouchableOpacity
              style={styles.mainEventCard}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/events')}
            >
              <Image
                source={{ uri: dashboard.mainEvent.foto_evento || FALLBACK_EVENT_IMAGE }}
                style={styles.mainEventImage}
              />

              <View style={styles.mainEventHeader}>
                <Text style={styles.mainEventTitle}>{dashboard.mainEvent.titulo}</Text>

                <Ionicons name="chevron-forward" size={26} color={colors.text} />
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.mainEventInfo}>{dashboard.mainEvent.local}</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.mainEventInfo}>
                  {formatDateTime(dashboard.mainEvent.data_inicio)}
                </Text>
              </View>

              <View style={styles.detailsButton}>
                <Text style={styles.detailsText}>Ver detalhes</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento disponivel.</Text>
          )}
        </View>

        <View style={styles.activityWrapper}>
          <Text style={styles.activitySectionTitle}>Atividade recente</Text>

          {dashboard.recent.length > 0 ? (
            dashboard.recent.map((eventItem) => {
              const badge = formatMonthBadge(eventItem.data_inicio);

              return (
                <TouchableOpacity
                  key={getEventId(eventItem)}
                  style={styles.activityCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/events')}
                >
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateMonth}>{badge.month}</Text>
                    <Text style={styles.dateDay}>{badge.day}</Text>
                  </View>

                  <View style={styles.activityTextArea}>
                    <Text style={styles.activityTitle}>{eventItem.titulo}</Text>
                    <Text style={styles.activityMeta}>{eventItem.local}</Text>
                  </View>

                  <Text style={styles.activityTime}>
                    {formatDateOnly(eventItem.data_inicio)}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhuma atividade recente.</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  topBarTitle: {
    color: colors.text,
    fontWeight: '700',
    ...typography.body,
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
    ...shadows.small,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  heroLocation: {
    ...typography.caption,
    color: colors.textMuted,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  actionText: {
    color: colors.text,
    fontWeight: '600',
    ...typography.bodySmall,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
    ...typography.body,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  highlightItem: {
    alignItems: 'center',
    width: '30%',
  },
  highlightImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    backgroundColor: '#101728',
  },
  highlightTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  highlightDate: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  mainEventCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mainEventImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundCard,
  },
  mainEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  mainEventTitle: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mainEventInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  detailsButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  detailsText: {
    color: '#FFF',
    fontWeight: '600',
    ...typography.bodySmall,
  },
  activityWrapper: {
    marginTop: spacing.xs,
  },
  activitySectionTitle: {
    ...typography.h2,
    color: colors.text,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  activityCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    fontSize: 10,
    color: '#B9C1D9',
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  activityTextArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  activityTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  activityMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    maxWidth: 90,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
