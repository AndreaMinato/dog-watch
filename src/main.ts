import { createApp } from 'vue'
import App from './App.vue'
import { ensureAnonymousSession } from './room/supabase'
import router from './router'
import OfflineView from './views/OfflineView.vue'
import './style.css'

const app = createApp(App)

app.use(router)

ensureAnonymousSession().then(
  () => app.mount('#app'),
  (cause: unknown) => {
    console.error(cause)
    createApp(OfflineView).mount('#app')
  },
)
