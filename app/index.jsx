import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&h=1000&fit=crop&auto=format';

const USER_ROLES = {
  CLIENTE: 'CLIENTE',
  ARTISTA: 'ARTISTA',
  ADMINISTRADOR: 'ADMINISTRADOR',
  CASASHOW: 'CASASHOW',
};

const mockUsers = {
  'cliente@nightout.com': {
    password: '123456',
    role: USER_ROLES.CLIENTE,
    name: 'Cliente',
  },
  'artista@nightout.com': {
    password: '123456',
    role: USER_ROLES.ARTISTA,
    name: 'Artista',
  },
  'admin@nightout.com': {
    password: '123456',
    role: USER_ROLES.ADMINISTRADOR,
    name: 'Admin',
  },
  'casa@nightout.com': {
    password: '123456',
    role: USER_ROLES.CASASHOW,
    name: 'Casa Show',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CLIENTE);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError(false);
    setPasswordError(false);

    if (!email || !validateEmail(email)) {
      setEmailError(true);
      return;
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = mockUsers[email.toLowerCase()];

      if (user && user.password === password) {
        if (user.role === USER_ROLES.CLIENTE) {
          router.replace('/(tabs)');
        } else if (user.role === USER_ROLES.ARTISTA) {
          router.replace('/(tabs)/events');
        } else if (user.role === USER_ROLES.CASASHOW) {
          router.replace('/(tabs)/venues');
        } else {
          router.replace('/(tabs)/profile');
        }
      } else {
        setPasswordError(true);
      }

      setLoading(false);
    }, 1500);
  };

  const getRoleDisplay = () => {
    switch (selectedRole) {
      case USER_ROLES.ADMINISTRADOR:
        return 'Admin';
      case USER_ROLES.ARTISTA:
        return 'Artista';
      case USER_ROLES.CASASHOW:
        return 'Casa Show';
      default:
        return 'Cliente';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <ImageBackground
            source={{ uri: HERO_IMAGE }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(10, 14, 26, 0.3)', 'rgba(10, 14, 26, 0.85)']}
              style={styles.heroOverlay}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Bem-vindo ao NightOut</Text>
                <Text style={styles.heroSubtitle}>
                  A plataforma completa para gerenciar sua vida noturna
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>

          <View style={styles.authContainer}>
            <View style={styles.authContent}>
              <Text style={styles.authTitle}>Entrar na conta</Text>
              <Text style={styles.authSubtitle}>
                Acesse com suas credenciais para continuar
              </Text>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>entre com email</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <Input
                  icon={Mail}
                  placeholder="SeuEmail@gmail.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError(false);
                  }}
                  keyboardType="email-address"
                  error={emailError}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <Input
                  icon={Lock}
                  placeholder="Senha"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(false);
                  }}
                  secureTextEntry
                  error={passwordError}
                />
              </View>

              <Button
                title="Entrar"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <View style={styles.checkboxInner} />}
                </View>
                <Text style={styles.checkboxLabel}>Lembrar de mim</Text>
              </TouchableOpacity>

              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={styles.rolePill}
                  activeOpacity={0.8}
                  onPress={() => {
                    const roles = Object.values(USER_ROLES);
                    const currentIndex = roles.indexOf(selectedRole);
                    const nextIndex = (currentIndex + 1) % roles.length;
                    setSelectedRole(roles[nextIndex]);
                  }}
                >
                  <LinearGradient
                    colors={[colors.secondary, '#C77DFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.rolePillGradient}
                  >
                    <Text style={styles.rolePillText}>{getRoleDisplay()}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Não possui uma conta? </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/register')}
                >
                  <Text style={styles.registerLink}>Registre-se</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroImage: {
    width: '100%',
    height: 320,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: -spacing.lg,
    ...shadows.large,
  },
  authContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  authTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  authSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
    textTransform: 'lowercase',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  checkboxLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  roleContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  rolePill: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.medium,
  },
  rolePillGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rolePillText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  registerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});