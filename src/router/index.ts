import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import ProfilePage from '../views/ProfilePage.vue'
import { supabase } from '@/lib/supabase'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  if (!supabase) return to.meta.requiresAuth ? '/home' : true

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error

  if (to.meta.requiresAuth && !session) return '/home'
  if (to.name === 'Home' && session && to.query.updatePassword !== '1') return '/profile'
  return true
})

export default router
