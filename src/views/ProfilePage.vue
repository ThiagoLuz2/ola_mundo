<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Meu perfil</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="busy" @click="signOut">Sair</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="profile-content">
      <main class="profile-card">
        <p class="eyebrow">Seus dados</p>
        <h1>Perfil</h1>

        <div class="avatar-area">
          <img v-if="avatarUrl" class="avatar" :src="avatarUrl" alt="Foto do perfil" />
          <div v-else class="avatar avatar-placeholder" aria-label="Sem foto de perfil">
            {{ initials }}
          </div>
          <label class="photo-picker">
            <span>{{ uploading ? 'Enviando foto...' : 'Escolher foto' }}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              :disabled="uploading || busy"
              @change="uploadAvatar"
            />
          </label>
          <small>JPG, PNG ou WebP. Até 5 MB.</small>
        </div>

        <ion-text v-if="feedback" :color="feedbackColor">
          <p class="notice" role="status">{{ feedback }}</p>
        </ion-text>

        <form @submit.prevent="saveProfile">
          <ion-input
            v-model="fullName"
            label="Nome"
            label-placement="stacked"
            autocomplete="name"
            required
          />
          <ion-input
            v-model="birthDate"
            type="date"
            label="Data de nascimento"
            label-placement="stacked"
            required
          />
          <ion-input
            v-model="nickname"
            label="Nickname"
            label-placement="stacked"
            autocomplete="nickname"
            required
          />
          <ion-button expand="block" type="submit" :disabled="busy || uploading">
            {{ busy ? 'Salvando...' : 'Salvar perfil' }}
          </ion-button>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const fullName = ref('')
const birthDate = ref('')
const nickname = ref('')
const avatarUrl = ref('')
const busy = ref(false)
const uploading = ref(false)
const feedback = ref('')
const feedbackColor = ref<'success' | 'danger'>('success')
const initials = computed(() => fullName.value.trim().slice(0, 2).toUpperCase() || '👤')

onMounted(loadProfile)

async function loadProfile() {
  if (!supabase) return
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) {
      await router.replace('/home')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, birth_date, nickname, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error

    if (data) {
      fullName.value = data.full_name ?? ''
      birthDate.value = data.birth_date ?? ''
      nickname.value = data.nickname ?? ''
      avatarUrl.value = data.avatar_url ?? ''
    }
  } catch (error) {
    showError(error)
  }
}

async function saveProfile() {
  if (!supabase) return
  busy.value = true
  feedback.value = ''
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('Sua sessão expirou. Entre novamente.')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.value.trim(),
      birth_date: birthDate.value,
      nickname: nickname.value.trim(),
      avatar_url: avatarUrl.value || null,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
    feedbackColor.value = 'success'
    feedback.value = 'Perfil salvo com sucesso.'
  } catch (error) {
    showError(error)
  } finally {
    busy.value = false
  }
}

async function uploadAvatar(event: Event) {
  if (!supabase) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showError(new Error('Escolha uma imagem JPG, PNG ou WebP.'))
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showError(new Error('A imagem deve ter no máximo 5 MB.'))
    return
  }

  uploading.value = true
  feedback.value = ''
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!user) throw new Error('Sua sessão expirou. Entre novamente.')

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(objectPath, file, { contentType: file.type, cacheControl: '3600' })
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath)
    avatarUrl.value = data.publicUrl
    feedbackColor.value = 'success'
    feedback.value = 'Foto enviada. Salve o perfil para registrar a alteração.'
  } catch (error) {
    showError(error)
  } finally {
    uploading.value = false
  }
}

async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) {
    showError(error)
    return
  }
  await router.replace('/home')
}

function showError(error: unknown) {
  feedbackColor.value = 'danger'
  feedback.value = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}
</script>

<style scoped>
.profile-content {
  --background: #f4f7fb;
}

.profile-card {
  box-sizing: border-box;
  width: min(100% - 32px, 560px);
  margin: 32px auto;
  padding: 32px;
  border: 1px solid #e4eaf2;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 18px 55px #17324d12;
}

.eyebrow {
  margin-bottom: 4px;
  color: #147d68;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  margin: 8px 0 24px;
  color: #172b4d;
}

.avatar-area {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
}

.avatar {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: grid;
  place-items: center;
  background: #e7f4f0;
  color: #147d68;
  font-size: 1.8rem;
}

.photo-picker {
  padding: 9px 16px;
  border-radius: 9px;
  background: #e7f4f0;
  color: #126b59;
  cursor: pointer;
  font-weight: 600;
}

.photo-picker input {
  display: none;
}

.avatar-area small,
.notice {
  color: #65758b;
}

ion-input {
  margin: 16px 0;
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
  min-height: 48px;
}
</style>
