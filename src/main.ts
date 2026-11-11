import { createApp } from 'vue'
import App from './App.vue'
import { ensureAnonymousSession } from './room/supabase'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(router)

ensureAnonymousSession().then(() => app.mount('#app'))
