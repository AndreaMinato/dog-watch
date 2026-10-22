import { createApp } from 'vue'
import App from './App.vue'
import { ensureAnonymousSession } from './room/supabase'
import router from './router'

const app = createApp(App)

app.use(router)

ensureAnonymousSession().then(() => app.mount('#app'))
