import { createApp, ref, watch } from 'vue'
import App from './App.vue'
import '../style.css'

const root = document.createElement('div')
root.id = 'crx-root'
document.body.append(root)
document.body.style.border = '2px solid red'

const connectPort = ref<chrome.runtime.Port>()

chrome.runtime.onConnect.addListener((port) => {
  console.info('开始建立连接')
  connectPort.value = port
  port.onMessage.addListener((msg) => {
    console.info(msg)
  })
})

watch(connectPort, (port) => {
  if (!port) {
    return
  }

  port.onMessage.addListener((msg) => {
    console.info(msg)
  })
})

const app = createApp(App)

app.mount(root)
