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
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth-store'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing } from '@/constants/theme'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore((s) => s.register)
  const router = useRouter()

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      Alert.alert('Registration Failed', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a2e', '#16213e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={['#e8ff47', '#7fff00']} style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </LinearGradient>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Start tracking your gains</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={Colors.dark.textMuted}
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            </View>

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
                placeholder="Password (min 8 chars)"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={['#e8ff47', '#a8e000']} style={styles.registerButton}>
                {loading ? (
                  <ActivityIndicator color={Colors.dark.textOnAccent} />
                ) : (
                  <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
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
  header: {
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
  title: {
    color: Colors.dark.text,
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
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
  registerButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  registerButtonText: {
    color: Colors.dark.textOnAccent,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  loginLink: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  loginText: {
    color: Colors.dark.textMuted,
    fontSize: FontSize.md,
  },
  loginAccent: {
    color: Colors.dark.accent,
    fontWeight: FontWeight.semibold,
  },
})
