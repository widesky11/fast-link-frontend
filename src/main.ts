import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { setupAuthRefresh } from './utils/auth'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 恢复自动续期（刷新页面后不丢）+ 监听回到前台时检查
setupAuthRefresh()

app.mount('#app')
