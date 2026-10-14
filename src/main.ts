import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

const handledAppUrls = new Set<string>()

async function handleAppUrl(url: string) {
  if (handledAppUrls.has(url)) return
  handledAppUrls.add(url)

  try {
    const callbackUrl = new URL(url)
    const code = callbackUrl.searchParams.get('code')
    let authError: string | undefined

    if (code && supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) authError = error.message
    } else if (code) {
      authError = 'Configure as credenciais do Supabase antes de concluir a autenticação.'
    } else if (callbackUrl.searchParams.has('error_description')) {
      authError = callbackUrl.searchParams.get('error_description') ?? undefined
    }

    await router.replace({
      path: '/home',
      query: {
        ...(callbackUrl.searchParams.get('updatePassword') === '1' ? { updatePassword: '1' } : {}),
        ...(authError ? { authError } : {}),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o retorno de autenticação.'
    console.error(message)
    await router.replace({ path: '/home', query: { authError: message } })
  }
}

if (Capacitor.isNativePlatform()) {
  void CapacitorApp.addListener('appUrlOpen', ({ url }) => handleAppUrl(url))
}

router.isReady().then(async () => {
  if (Capacitor.isNativePlatform()) {
    const launchUrl = await CapacitorApp.getLaunchUrl()
    if (launchUrl?.url) await handleAppUrl(launchUrl.url)
  }
  app.mount('#app');
});
