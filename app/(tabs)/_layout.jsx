import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { session } = useAuth();

  const isCasaShow = session?.tipo === 'CASASHOW';
  const isCliente = session?.tipo === 'CLIENTE';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile-costumer"
        options={{
          href: isCliente ? undefined : null,
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile-casa-show"
        options={{
          href: isCasaShow ? undefined : null,
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="venues"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}