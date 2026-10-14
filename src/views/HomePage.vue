<template>
  <ion-page>
    <ion-content class="auth-content">
      <main class="auth-card">
        <p class="eyebrow">Ionic · Vue · Supabase</p>
        <h1>{{ pageTitle }}</h1>
        <p class="intro">{{ pageDescription }}</p>

        <ion-text v-if="!supabase" color="danger">
          <p class="notice">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para conectar ao Supabase.</p>
        </ion-text>
        <ion-text v-else-if="feedback" :color="feedbackColor">
          <p class="notice" role="status">{{ feedback }}</p>
        </ion-text>

        <form v-if="mode === 'reset'" @submit.prevent="updatePassword">
          <ion-input
            v-model="password"
            type="password"
            label="Nova senha"
            label-placement="stacked"
            autocomplete="new-password"
            :minlength="6"
            required
          />
          <ion-button expand="block" type="submit" :disabled="busy || !supabase">
            {{ busy ? 'Salvando...' : 'Salvar nova senha' }}
          </ion-button>
        </form>

        <form v-else @submit.prevent="submit">
          <ion-input
            v-model="email"
            type="email"
            label="E-mail"
            label-placement="stacked"
            placeholder="voce@exemplo.com"
            autocomplete="email"
            required
          />
          <ion-input
            v-if="mode !== 'recovery'"
            v-model="password"
            type="password"
            label="Senha"
            label-placement="stacked"
            placeholder="Mínimo de 6 caracteres"
            :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'"
            :minlength="6"
            required
          />
          <ion-button expand="block" type="submit" :disabled="busy || !supabase">
            {{ busy ? 'Aguarde...' : submitLabel }}
          </ion-button>
        </form>

        <nav v-if="mode !== 'reset'" class="auth-links" aria-label="Opções de autenticação">
          <button v-if="mode === 'login'" type="button" @click="setMode('recovery')">Esqueci minha senha</button>
          <button v-if="mode === 'login'" type="button" @click="setMode('signup')">Criar uma conta</button>
          <button v-if="mode !== 'login'" type="button" @click="setMode('login')">Voltar para o login</button>
        </nav>
        <button v-else class="back-link" type="button" @click="router.replace('/home')">Voltar para o login</button>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { IonButton, IonContent, IonInput, IonPage, IonText } from '@ionic/vue'
import { supabase } from '@/lib/supabase'

type AuthMode = 'login' | 'signup' | 'recovery' | 'reset'

const route = useRoute()
const router = useRouter()
const mode = ref<AuthMode>(route.query.updatePassword === '1' ? 'reset' : 'login')
const email = ref('')
const password = ref('')
const busy = ref(false)
const feedback = ref(typeof route.query.authError === 'string' ? route.query.authError : '')
const feedbackColor = ref<'success' | 'danger'>(feedback.value ? 'danger' : 'success')

watch(() => route.query.updatePassword, (value) => {
  if (value === '1') mode.value = 'reset'
})

const pageTitle = computed(() => ({
  login: 'Bem-vindo de volta',
  signup: 'Crie sua conta',
  recovery: 'Recupere sua senha',
  reset: 'Defina uma nova senha',
}[mode.value]))

const pageDescription = computed(() => ({
  login: 'Entre para acessar seu perfil.',
  signup: 'Cadastre-se para começar a usar o aplicativo.',
  recovery: 'Enviaremos um link para você redefinir sua senha.',
  reset: 'Escolha uma senha nova para sua conta.',
}[mode.value]))

const submitLabel = computed(() => ({
  login: 'Entrar',
  signup: 'Criar conta',
  recovery: 'Enviar link de recuperação',
  reset: 'Salvar nova senha',
}[mode.value]))

function setMode(nextMode: AuthMode) {
  mode.value = nextMode
  feedback.value = ''
  password.value = ''
}

async function submit() {
  if (!supabase) return

  busy.value = true
  feedback.value = ''
  try {
    if (mode.value === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      await router.replace('/profile')
      return
    }

    if (mode.value === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email: email.value, password: password.value })
      if (error) throw error
      if (data.session) {
        await router.replace('/profile')
      } else {
        feedback.value = 'Cadastro realizado. Verifique seu e-mail para confirmar a conta e depois faça login.'
      }
      return
    }

    const redirectTo = Capacitor.isNativePlatform()
      ? 'io.ionic.starter://auth/callback?updatePassword=1'
      : `${window.location.origin}/home?updatePassword=1`
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, { redirectTo })
    if (error) throw error
    feedback.value = 'Se houver uma conta para este e-mail, você receberá um link de recuperação.'
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

async function updatePassword() {
  if (!supabase) return
  busy.value = true
  feedback.value = ''
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    feedbackColor.value = 'success'
    feedback.value = 'Senha atualizada. Redirecionando para seu perfil...'
    await router.replace('/profile')
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

function showError(error: unknown) {
  feedbackColor.value = 'danger'
  feedback.value = error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
}
</script>

<style scoped>
.auth-content {
  --background: linear-gradient(145deg, #f4f7ff 0%, #eef9f6 100%);
}

.auth-card {
  box-sizing: border-box;
  width: min(100% - 32px, 440px);
  margin: 10vh auto;
  padding: 32px;
  border: 1px solid #e4eaf2;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 55px #17324d12;
}

.eyebrow {
  color: #167d68;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 8px;
  color: #172b4d;
  font-size: 2rem;
}

.intro,
.notice {
  color: #65758b;
  line-height: 1.5;
}

ion-input {
  margin: 18px 0;
  --padding-start: 12px;
  --padding-end: 12px;
  --background: #f7f9fc;
  border: 1px solid #e1e7ef;
  border-radius: 10px;
}

ion-button {
  margin-top: 24px;
  --border-radius: 10px;
  --background: #147d68;
  --background-activated: #106653;
  min-height: 48px;
}

.auth-links {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.auth-links button,
.back-link {
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #147d68;
  cursor: pointer;
  font: inherit;
}

.back-link {
  margin-top: 20px;
}
</style>
