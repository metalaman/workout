import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, Href } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      Alert.alert('Login Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a2e', '#16213e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </LinearGradient>
            <Text style={styles.logoTitle}>IRONLOG</Text>
            <Text style={styles.logoSubtitle}>TRACK. LIFT. GROW.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor={Colors.dark.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.signInButton}>
                {loading ? (
                  <ActivityIndicator color={Colors.dark.textOnAccent} />
                ) : (
                  <Text style={styles.signInText}>SIGN IN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social logins */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Text style={styles.socialButtonText}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Text style={styles.socialButtonText}></Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as Href)} style={styles.registerLink}>
            <Text style={styles.registerText}>
              New here? <Text style={styles.registerAccent}>Create account</Text>
            </Text>
          </TouchableOpacity>

          {/* Dev skip */}
          {__DEV__ && (
            <TouchableOpacity onPress={() => useAuthStore.getState().skipAuth()} style={styles.devSkip}>
              <Text style={styles.devSkipText}>⚡ Skip Login (Dev)</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoTitle: {
    color: Colors.dark.text,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.base,
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  form: {
    gap: Spacing.md + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg + 1,
    gap: Spacing.md,
  },
  inputIcon: {
    fontSize: FontSize.lg,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: FontSize.lg,
  },
  signInButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  signInText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.borderLight,
  },
  dividerText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md + 2,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  socialButtonText: {
    color: Colors.dark.text,
    fontSize: 18,
  },
  registerLink: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  registerText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
  },
  registerAccent: {
    color: Colors.dark.accent,
    fontWeight: FontWeight.semibold,
  },
  devSkip: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232,255,71,0.2)',
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
  },
  devSkipText: {
    color: Colors.dark.accent,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
})
