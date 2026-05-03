import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const eventosDestaque = [
  {
    id: '1',
    titulo: 'Du e Bielzin',
    data: '24 fev',
    imagem:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    titulo: 'Terapia sem f..',
    data: '27 fev',
    imagem:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    titulo: 'Festa',
    data: '28 fev',
    imagem:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80',
  },
];

const atividadeRecente = [
  {
    id: '1',
    mes: 'NOV.',
    dia: '24',
    titulo: 'Terapia sem fim com Nattan',
    tempo: 'Há duas semanas',
  },
  {
    id: '2',
    mes: 'NOV.',
    dia: '25',
    titulo: 'Festa',
    tempo: 'Há três semanas',
  },
  {
    id: '3',
    mes: 'NOV.',
    dia: '26',
    titulo: 'After com Nattan',
    tempo: 'Há quatro semanas',
  },
];

function getAvatarLetter(nome) {
  if (!nome || typeof nome !== 'string') return 'C';
  return nome.trim().charAt(0).toUpperCase() || 'C';
}

export default function ClientDashboardScreen() {
  const [nome, setNome] = useState('Cliente');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await AsyncStorage.getItem('user_session');

        if (session) {
          const parsed = JSON.parse(session);
          setNome(parsed?.nome || 'Cliente');
        }
      } catch (error) {
        console.log('Erro ao carregar sessão:', error);
      }
    };

    loadUser();
  }, []);

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
            onPress={() => router.push('/profile-costumer')}
          >
            <Ionicons name="person-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🔥 Eventos em destaque</Text>

          <View style={styles.highlightRow}>
            {eventosDestaque.map((evento) => (
              <TouchableOpacity
                key={evento.id}
                style={styles.highlightItem}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/events')}
              >
                <Image
                  source={{ uri: evento.imagem }}
                  style={styles.highlightImage}
                />
                <Text style={styles.highlightTitle} numberOfLines={1}>
                  {evento.titulo}
                </Text>
                <Text style={styles.highlightDate}>{evento.data}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📍 Eventos perto de você</Text>

          <TouchableOpacity
            style={styles.mainEventCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/events')}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
              }}
              style={styles.mainEventImage}
            />

            <View style={styles.mainEventHeader}>
              <Text style={styles.mainEventTitle}>
                Terapia sem fim com Nattan
              </Text>

              <Ionicons
                name="chevron-forward"
                size={26}
                color={colors.text}
              />
            </View>

            <Text style={styles.mainEventInfo}>📍 Av. Bezerra de Menezes</Text>
            <Text style={styles.mainEventInfo}>🕒 23:00</Text>

            <TouchableOpacity
              style={styles.detailsButton}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/events')}
            >
              <Text style={styles.detailsText}>Ver detalhes</Text>
            </TouchableOpacity>

            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.dot, styles.dotActive]}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/events')}
              />
              <TouchableOpacity
                style={styles.dot}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/events')}
              />
              <TouchableOpacity
                style={styles.dot}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/events')}
              />
              <TouchableOpacity
                style={styles.dot}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/events')}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.activityWrapper}>
          <Text style={styles.activitySectionTitle}>Atividade Recente</Text>

          {atividadeRecente.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.activityCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/events')}
            >
              <View style={styles.dateBadge}>
                <Text style={styles.dateMonth}>{item.mes}</Text>
                <Text style={styles.dateDay}>{item.dia}</Text>
              </View>

              <View style={styles.activityTextArea}>
                <Text style={styles.activityTitle}>{item.titulo}</Text>
              </View>

              <Text style={styles.activityTime}>{item.tempo}</Text>
            </TouchableOpacity>
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
  pagination: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 26,
    height: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  backgroundColor: 'rgba(0, 102, 255, 0.12)', // mais suave
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
  activityTime: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    maxWidth: 90,
  },
});