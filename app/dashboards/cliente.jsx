import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getClientById, getClients, getEvents } from '../../services/api';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const EVENT_IMAGES = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80',
];

function getAvatarLetter(nome) {
  if (!nome || typeof nome !== 'string') return 'C';
  return nome.trim().charAt(0).toUpperCase() || 'C';
}

function formatBirthDate(value) {
  if (!value) return 'Não informado';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';

  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function formatEventCardDate(value) {
  if (!value) return 'Data a definir';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a definir';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function formatEventHour(value) {
  if (!value) return 'Horário a definir';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Horário a definir';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ClientDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [cliente, setCliente] = useState({
    id: '',
    nome: 'Cliente',
    email: 'Não informado',
    telefone: 'Não informado',
    apelido: 'Não informado',
    preferencias: 'Não informado',
    dataNascimento: null,
  });
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const session = await AsyncStorage.getItem('user_session');

        if (!session) {
          throw new Error('Sessão não encontrada.');
        }

        const parsed = JSON.parse(session);

        if (!parsed?.token) {
          throw new Error('Sessão inválida.');
        }

        const clients = await getClients(parsed.token);
        const lista = Array.isArray(clients)
          ? clients
          : clients?.items || clients?.clientes || [];

        const clienteDaSessao = lista.find(
          (item) => item?.email?.toLowerCase() === parsed?.email?.toLowerCase()
        );

        if (!clienteDaSessao?.id) {
          throw new Error('Cliente logado não encontrado.');
        }

        const [clientResponse, eventsResponse] = await Promise.allSettled([
          getClientById(clienteDaSessao.id, parsed.token),
          getEvents(parsed.token),
        ]);

        if (clientResponse.status === 'fulfilled') {
          const response = clientResponse.value;

          setCliente({
            id: response?.id_usuario || clienteDaSessao.id,
            nome: response?.usuario?.nome || parsed?.nome || 'Cliente',
            email: response?.usuario?.email || parsed?.email || 'Não informado',
            telefone: response?.usuario?.telefone || 'Não informado',
            apelido: response?.apelido || 'Não informado',
            preferencias: response?.preferencias || 'Não informado',
            dataNascimento: response?.data_nascimento || null,
          });

          setWarning('');
        } else {
          throw clientResponse.reason;
        }

        if (eventsResponse.status === 'fulfilled') {
          const raw = Array.isArray(eventsResponse.value)
            ? eventsResponse.value
            : eventsResponse.value?.items || eventsResponse.value?.eventos || [];

          const normalized = raw
            .map((item, index) => ({
              id: item?.id_evento || item?.id || `evento-${index}`,
              titulo: item?.titulo || 'Evento sem título',
              data_inicio: item?.data_inicio || null,
              local: item?.local || 'Local a definir',
              status: item?.status || '',
              imagem: EVENT_IMAGES[index % EVENT_IMAGES.length],
            }))
            .filter((item) => item.titulo);

          setEventos(normalized);
        } else {
          setEventos([]);
        }
      } catch (error) {
        console.log('Erro ao carregar cliente:', error?.message || error);

        try {
          const session = await AsyncStorage.getItem('user_session');
          const parsed = session ? JSON.parse(session) : null;

          setCliente({
            id: '',
            nome: parsed?.nome || 'Cliente',
            email: parsed?.email || 'Não informado',
            telefone: 'Não informado',
            apelido: 'Não informado',
            preferencias: 'Não informado',
            dataNascimento: null,
          });
        } catch {
          setCliente({
            id: '',
            nome: 'Cliente',
            email: 'Não informado',
            telefone: 'Não informado',
            apelido: 'Não informado',
            preferencias: 'Não informado',
            dataNascimento: null,
          });
        }

        setEventos([]);
        setWarning('Alguns dados do perfil não puderam ser carregados agora.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const eventosDestaque = useMemo(() => eventos.slice(0, 3), [eventos]);
  const eventoPrincipal = useMemo(() => (eventos.length > 0 ? eventos[0] : null), [eventos]);

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

  const nome = cliente?.nome || 'Cliente';
  const eventosIndisponiveis = eventos.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

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
            <Text style={styles.heroTitle}>Olá, {nome}!</Text>
            <Text style={styles.heroSubtitle}>
              🎉 Descubra os melhores eventos para você
            </Text>
            <Text style={styles.heroLocation}>📍 Fortaleza, CE</Text>
          </View>
        </View>

        {warning ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>👤 Dados do usuário</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{cliente.nome}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{cliente.email}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>{cliente.telefone}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Apelido</Text>
            <Text style={styles.infoValue}>{cliente.apelido}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Preferências</Text>
            <Text style={styles.infoValue}>{cliente.preferencias}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data de nascimento</Text>
            <Text style={styles.infoValue}>
              {formatBirthDate(cliente.dataNascimento)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <Ionicons name="calendar-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Eventos</Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.85}
            onPress={() => router.push('/profile-costumer')}
          >
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔥 Eventos em destaque</Text>

          {eventosIndisponiveis ? (
            <Text style={styles.emptyText}>Eventos indisponíveis no momento.</Text>
          ) : (
            <View style={styles.highlightRow}>
              {eventosDestaque.map((evento) => (
                <View key={evento.id} style={styles.highlightItem}>
                  <Image
                    source={{ uri: evento.imagem }}
                    style={styles.highlightImage}
                  />
                  <Text style={styles.highlightTitle} numberOfLines={1}>
                    {evento.titulo}
                  </Text>
                  <Text style={styles.highlightDate}>
                    {formatEventCardDate(evento.data_inicio)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Eventos disponíveis</Text>

          {eventosIndisponiveis || !eventoPrincipal ? (
            <Text style={styles.emptyText}>Eventos indisponíveis no momento.</Text>
          ) : (
            <View style={styles.mainEventCard}>
              <Image
                source={{ uri: eventoPrincipal.imagem }}
                style={styles.mainEventImage}
              />

              <View style={styles.mainEventHeader}>
                <Text style={styles.mainEventTitle}>
                  {eventoPrincipal.titulo}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color={colors.text}
                />
              </View>

              <Text style={styles.mainEventInfo}>
                📍 {eventoPrincipal.local}
              </Text>
              <Text style={styles.mainEventInfo}>
                🕒 {formatEventHour(eventoPrincipal.data_inicio)}
              </Text>

              <View style={styles.detailsButton}>
                <Text style={styles.detailsText}>Disponível no momento</Text>
              </View>
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
    alignItems: 'center',
    justifyContent: 'center',
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
  warningCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningText: {
    ...typography.bodySmall,
    color: '#F59E0B',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  infoItem: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
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
  mainEventInfo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
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
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});