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

router.beforeEach(async (to, from) => {
  const cameraRoom = from === START_LOCATION ? cameraRoomToReenter() : undefined
  if (!cameraRoom)
    return
  try {
    await useRoom().join(cameraRoom)
  }
  catch (error) {
    console.error(error)
    return
  }
  return to.name === 'room' ? undefined : { name: 'room' }
})

export default router
