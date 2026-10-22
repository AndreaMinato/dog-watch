import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { cameraRoomToReenter } from '../room/remembered-rooms'
import { useRoom } from '../room/use-room'
import CreateRoomView from '../views/CreateRoomView.vue'
import HomeView from '../views/HomeView.vue'
import HowItWorksView from '../views/HowItWorksView.vue'
import JoinRoomView from '../views/JoinRoomView.vue'
import RoomView from '../views/RoomView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/crea', name: 'create', component: CreateRoomView },
    { path: '/entra', name: 'join', component: JoinRoomView },
    { path: '/come-funziona', name: 'how-it-works', component: HowItWorksView },
    {
      path: '/stanza',
      name: 'room',
      component: RoomView,
      beforeEnter: () => useRoom().room.value ? true : { name: 'home' },
    },
  ],
})

// The Stanze recenti on the home page take the Camera back into its room.
router.beforeEach((to, from) => {
  if (from === START_LOCATION && to.name !== 'home' && cameraRoomToReenter())
    return { name: 'home' }
})

export default router
