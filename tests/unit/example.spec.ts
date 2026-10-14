import { mount } from '@vue/test-utils'
import { IonicVue } from '@ionic/vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import { describe, expect, test } from 'vitest'

describe('HomePage.vue', () => {
  test('renders login and explains missing Supabase configuration', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomePage }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(HomePage, { global: { plugins: [IonicVue, router] } })
    expect(wrapper.text()).toContain('Bem-vindo de volta')
    expect(wrapper.text()).toContain('Esqueci minha senha')
    expect(wrapper.text()).toContain('Configure VITE_SUPABASE_URL')
  })
})
