import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/api';
import {
  formatDateTime,
  getEventId,
  isFutureOrToday,
  normalizeEvent,
  parseApiDate,
} from '../../utils/casaShowData';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';

const STATUS_OPTIONS = ['TODOS', 'ATIVOS', 'FINALIZADOS'];
const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
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
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

const INITIAL_FORM = {
  titulo: '',
  descricao: '',
  data_inicio: null,
  data_fim: null,
  local: '',
};

function getEventLifecycleStatus(eventItem) {
  const status = String(eventItem?.status || '').toUpperCase();

  if (status === 'CANCELADO') return 'CANCELADO';

  return isFutureOrToday(eventItem.data_inicio) ? 'ATIVO' : 'FINALIZADO';
}

function getStatusStyles(status) {
  if (status === 'ATIVO') {
    return {
      badge: styles.statusActiveBadge,
      text: styles.statusActiveText,
      label: 'Ativo',
    };
  }

  if (status === 'CANCELADO') {
    return {
      badge: styles.statusCanceledBadge,
      text: styles.statusCanceledText,
      label: 'Cancelado',
    };
  }

  return {
    badge: styles.statusFinishedBadge,
    text: styles.statusFinishedText,
    label: 'Finalizado',
  };
}

function buildCalendarMatrix(month, year) {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
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

function sameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDateWithTime(baseDate, hour, minute) {
  const nextDate = new Date(baseDate);
  nextDate.setHours(hour, minute, 0, 0);
  return nextDate;
}

function formatPickerValue(value) {
  return value ? formatDateTime(value.toISOString()) : 'Selecionar data e hora';
}

function buildCreatedEvent(createdEvent, payload) {
  const response = createdEvent && typeof createdEvent === 'object' ? createdEvent : {};

  return normalizeEvent({
    ...response,
    id_usuario: response.id_usuario || response.id_casa_show || payload.id_usuario,
    titulo: response.titulo || payload.titulo,
    descricao: response.descricao || payload.descricao,
    data_inicio: response.data_inicio || response.data_evento || payload.data_inicio,
    data_fim: response.data_fim || payload.data_fim,
    local: response.local || response.endereco || payload.local,
    status: response.status || payload.status,
  });
}

function InlineDateTimePicker({
  value,
  title,
  onCancel,
  onConfirm,
}) {
  const initialDate = value || new Date();
  const [monthCursor, setMonthCursor] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedHour, setSelectedHour] = useState(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    Math.min(Math.round(initialDate.getMinutes() / 5) * 5, 55)
  );

  useEffect(() => {
    const nextInitialDate = value || new Date();
    setMonthCursor(new Date(nextInitialDate.getFullYear(), nextInitialDate.getMonth(), 1));
    setSelectedDate(nextInitialDate);
    setSelectedHour(nextInitialDate.getHours());
    setSelectedMinute(Math.min(Math.round(nextInitialDate.getMinutes() / 5) * 5, 55));
  }, [value]);

  const calendarWeeks = useMemo(
    () => buildCalendarMatrix(monthCursor.getMonth(), monthCursor.getFullYear()),
    [monthCursor]
  );

  function changeMonth(direction) {
    setMonthCursor((current) => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + direction);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(buildDateWithTime(selectedDate, selectedHour, selectedMinute));
  }

  return (
    <View style={styles.inlinePickerWrapper}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={onCancel}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.monthNavigator}>
        <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(-1)}>
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {MONTH_NAMES[monthCursor.getMonth()]} de {monthCursor.getFullYear()}
        </Text>

        <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(1)}>
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekLabel}>
            {day}
          </Text>
        ))}
      </View>

      {calendarWeeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (!day) {
              return <View key={`${weekIndex}-${dayIndex}`} style={styles.dayCellEmpty} />;
            }

            const date = new Date(
              monthCursor.getFullYear(),
              monthCursor.getMonth(),
              day
            );
            const isSelected = sameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={`${weekIndex}-${dayIndex}`}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                activeOpacity={0.85}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <Text style={styles.timePickerLabel}>Horario</Text>
      <View style={styles.timePickerRow}>
        <ScrollView style={styles.timeColumn} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {HOURS.map((hour) => {
            const isSelected = selectedHour === hour;

            return (
              <TouchableOpacity
                key={hour}
                style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                activeOpacity={0.85}
                onPress={() => setSelectedHour(hour)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    isSelected && styles.timeOptionTextSelected,
                  ]}
                >
                  {String(hour).padStart(2, '0')}h
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.timeColumn} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {MINUTES.map((minute) => {
            const isSelected = selectedMinute === minute;

            return (
              <TouchableOpacity
                key={minute}
                style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                activeOpacity={0.85}
                onPress={() => setSelectedMinute(minute)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    isSelected && styles.timeOptionTextSelected,
                  ]}
                >
                  {String(minute).padStart(2, '0')}m
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.modalButtonsRow}>
        <View style={styles.modalButtonWrapper}>
          <Button title="Cancelar" variant="outline" onPress={onCancel} />
        </View>

        <View style={styles.modalButtonWrapper}>
          <Button title="Confirmar" onPress={handleConfirm} />
        </View>
      </View>
    </View>
  );
}

export default function CasaShowEventosScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pickerTarget, setPickerTarget] = useState(null);

  const loadEvents = useCallback(async () => {
    const casaId = session?.id_usuario || session?.id;
    if (!casaId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError('');
      const response = await eventService.listByCasaShow(casaId);
      setEvents(Array.isArray(response) ? response.map(normalizeEvent) : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar os eventos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.id_usuario, session?.id]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const summary = useMemo(() => {
    const total = events.length;
    const ativos = events.filter((item) => getEventLifecycleStatus(item) === 'ATIVO').length;
    const finalizados = events.filter(
      (item) => getEventLifecycleStatus(item) === 'FINALIZADO'
    ).length;
    const cancelados = events.filter(
      (item) => getEventLifecycleStatus(item) === 'CANCELADO'
    ).length;

    return { total, ativos, finalizados, cancelados };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...events]
      .filter((item) => {
        const lifecycleStatus = getEventLifecycleStatus(item);
        const matchesStatus =
          selectedStatus === 'TODOS' ||
          (selectedStatus === 'ATIVOS' && lifecycleStatus === 'ATIVO') ||
          (selectedStatus === 'FINALIZADOS' && lifecycleStatus === 'FINALIZADO');

        const matchesSearch =
          !normalizedSearch ||
          item.titulo.toLowerCase().includes(normalizedSearch) ||
          item.local.toLowerCase().includes(normalizedSearch) ||
          lifecycleStatus.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = parseApiDate(a.data_inicio)?.getTime() || 0;
        const dateB = parseApiDate(b.data_inicio)?.getTime() || 0;
        return dateA - dateB;
      });
  }, [events, search, selectedStatus]);

  function updateFormField(field, value) {
    setForm((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFormError('');
    setPickerTarget(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalVisible(true);
  }

  function closeCreateModal() {
    setIsModalVisible(false);
    setFormError('');
    setPickerTarget(null);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadEvents();
  }

  async function handleCreateEvent() {
    setFormError('');

    if (!form.titulo.trim()) {
      setFormError('Informe o titulo do evento.');
      return;
    }

    if (!form.descricao.trim()) {
      setFormError('Informe a descricao do evento.');
      return;
    }

    if (!form.data_inicio) {
      setFormError('Selecione a data e hora de inicio.');
      return;
    }

    if (!form.data_fim) {
      setFormError('Selecione a data e hora de fim.');
      return;
    }

    if (form.data_inicio.getTime() >= form.data_fim.getTime()) {
      setFormError('A data de fim precisa ser maior que a data de inicio.');
      return;
    }

    if (!form.local.trim()) {
      setFormError('Informe o local do evento.');
      return;
    }

    const casaId = session?.id_usuario || session?.id;
    if (!casaId) {
      setFormError('Sessao invalida. Faca login novamente para criar eventos.');
      return;
    }

    try {
      setIsSubmitting(true);

      const eventPayload = {
        id_usuario: casaId,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        data_inicio: form.data_inicio.toISOString(),
        data_fim: form.data_fim.toISOString(),
        local: form.local.trim(),
        status: 'DISPONIVEL',
      };

      const createdEvent = await eventService.create(eventPayload);

      setEvents((prevState) => [buildCreatedEvent(createdEvent, eventPayload), ...prevState]);
      closeCreateModal();
      resetForm();
      Alert.alert('Sucesso', 'Evento criado com sucesso.');
    } catch (requestError) {
      setFormError(requestError.message || 'Nao foi possivel criar o evento agora.');
    } finally {
      setIsSubmitting(false);
    }
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

  const pickerValue = pickerTarget ? form[pickerTarget] : null;

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
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Eventos da Casa de Show</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile-casa-show')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadEvents}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Eventos da Casa de Show</Text>
            <Text style={styles.heroSubtitle}>
              Crie novos eventos e gerencie tudo em um so lugar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newEventButton}
            activeOpacity={0.85}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.newEventButtonText}>Novo Evento</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
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

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Lista de Eventos</Text>

            <View style={styles.actionsColumn}>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por titulo, local ou status"
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.85}
                onPress={() => setShowFilters((prevState) => !prevState)}
              >
                <Ionicons name="options-outline" size={18} color={colors.text} />
                <Text style={styles.filterButtonText}>Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showFilters ? (
            <View style={styles.filtersContainer}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.eventsList}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((eventItem) => {
                const statusStyles = getStatusStyles(getEventLifecycleStatus(eventItem));

                return (
                  <View key={getEventId(eventItem)} style={styles.eventCard}>
                    <View style={styles.eventDateBox}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    </View>

                    <View style={styles.eventContent}>
                      <View style={styles.eventTopRow}>
                        <Text style={styles.eventTitle}>{eventItem.titulo}</Text>

                        <View style={[styles.statusBadge, statusStyles.badge]}>
                          <Text style={[styles.statusText, statusStyles.text]}>
                            {statusStyles.label}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {eventItem.descricao}
                      </Text>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{eventItem.local}</Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          {formatDateTime(eventItem.data_inicio)} ate{' '}
                          {formatDateTime(eventItem.data_fim)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="calendar-blank"
                  size={46}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyStateTitle}>Nenhum evento encontrado</Text>
                <Text style={styles.emptyStateText}>
                  Ajuste a busca, troque o filtro ou crie um novo evento.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeCreateModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Evento da Casa</Text>

              <TouchableOpacity activeOpacity={0.8} onPress={closeCreateModal}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              nestedScrollEnabled
            >
              <Text style={styles.fieldLabel}>Titulo do Evento</Text>
              <TextInput
                style={styles.input}
                placeholder="Sunrise Beachclub com Nattan"
                placeholderTextColor={colors.textMuted}
                value={form.titulo}
                onChangeText={(value) => updateFormField('titulo', value)}
              />

              <Text style={styles.fieldLabel}>Descricao</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o evento, atracoes, regras, etc."
                placeholderTextColor={colors.textMuted}
                value={form.descricao}
                onChangeText={(value) => updateFormField('descricao', value)}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>Data / Hora de Inicio</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                activeOpacity={0.85}
                onPress={() => setPickerTarget('data_inicio')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatPickerValue(form.data_inicio)}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </TouchableOpacity>

              {pickerTarget === 'data_inicio' ? (
                <InlineDateTimePicker
                  value={pickerValue}
                  title="Inicio do evento"
                  onCancel={() => setPickerTarget(null)}
                  onConfirm={(value) => {
                    updateFormField('data_inicio', value);
                    setPickerTarget(null);
                  }}
                />
              ) : null}

              <Text style={styles.fieldLabel}>Data / Hora de Fim</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                activeOpacity={0.85}
                onPress={() => setPickerTarget('data_fim')}
              >
                <Text style={styles.pickerButtonText}>
                  {formatPickerValue(form.data_fim)}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </TouchableOpacity>

              {pickerTarget === 'data_fim' ? (
                <InlineDateTimePicker
                  value={pickerValue}
                  title="Fim do evento"
                  onCancel={() => setPickerTarget(null)}
                  onConfirm={(value) => {
                    updateFormField('data_fim', value);
                    setPickerTarget(null);
                  }}
                />
              ) : null}

              <Text style={styles.fieldLabel}>Local</Text>
              <TextInput
                style={styles.input}
                placeholder="Endereco ou descricao do local"
                placeholderTextColor={colors.textMuted}
                value={form.local}
                onChangeText={(value) => updateFormField('local', value)}
              />

              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

              <View style={styles.modalButtonsRow}>
                <View style={styles.modalButtonWrapper}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={closeCreateModal}
                  />
                </View>

                <View style={styles.modalButtonWrapper}>
                  <Button
                    title="Criar Evento"
                    onPress={handleCreateEvent}
                    loading={isSubmitting}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroTextContainer: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  newEventButton: {
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    ...shadows.small,
  },
  newEventButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  listCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  searchBox: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  filterButton: {
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.primary,
  },
  eventsList: {
    marginTop: spacing.xs,
  },
  eventCard: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventDateBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActiveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusActiveText: {
    color: colors.success,
  },
  statusFinishedBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  statusFinishedText: {
    color: '#8B9CFF',
  },
  statusCanceledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusCanceledText: {
    color: colors.error,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalScrollContent: {
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  pickerButton: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  formErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalButtonWrapper: {
    width: '48%',
  },
  inlinePickerWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  monthNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
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
    backgroundColor: '#1B2233',
    borderWidth: 1,
    borderColor: '#1A2742',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellEmpty: {
    width: '13.5%',
    aspectRatio: 1,
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
  dayTextSelected: {
    color: colors.primary,
  },
  timePickerLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: 150,
  },
  timeColumn: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#1B2233',
  },
  timeOption: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionSelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.18)',
  },
  timeOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  timeOptionTextSelected: {
    color: colors.primary,
  },
});