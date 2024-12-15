import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import 'element-plus/dist/index.css'
import '../style.css'

const root = document.createElement('div')
root.id = 'crx-root'
document.documentElement.append(root)

const pinia = createPinia()
const app = createApp(App)

app.use(ElementPlus)
app.use(pinia)

app.mount(root)
