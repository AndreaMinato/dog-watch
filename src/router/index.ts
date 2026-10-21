import { createRouter, createWebHistory } from 'vue-router'
import { useRoom } from '../room/use-room'
import CreateRoomView from '../views/CreateRoomView.vue'
import HomeView from '../views/HomeView.vue'
import JoinRoomView from '../views/JoinRoomView.vue'
import RoomView from '../views/RoomView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/crea', name: 'create', component: CreateRoomView },
    { path: '/entra', name: 'join', component: JoinRoomView },
    {
      path: '/stanza',
      name: 'room',
      component: RoomView,
      beforeEnter: () => useRoom().room.value ? true : { name: 'home' },
    },
  ],
})

export default router
