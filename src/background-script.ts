import { computed, reactive, ref } from 'vue'

const target = import.meta.env.VITE_TARGET_BASE_URL + import.meta.env.VITE_TARGET_PATH

console.info(`监听目标: ${target}`)

const activatedTabId = ref<number>()
const tab = ref<chrome.tabs.Tab>()

function literalObjectToFormData(obj: object | undefined) {
  const formData = new FormData()

  if (!obj) {
    return undefined
  }

  for (const key of Object.keys(obj)) {
    formData.append(key, (obj as any)[key])
  }

  return formData
}

function useWebRequest() {
  const url = ref<string>('')
  const requestInit = reactive<RequestInit>({
    method: 'GET',
    headers: undefined,
    // body: null,
  })

  const enable = computed(() => {

    const baseURL = new URL(url.value)

    return !/ajax/i.test(baseURL.pathname) && !baseURL.searchParams.has('webRequest', '1')
  })

  const cloneRequest = async () => {
    if (!enable.value) {
      return
    }
    const [baseURL] = url.value.split('?')
    const searchParams = new URL(url.value).searchParams
    searchParams.append('webRequest', '1')

    const webRequestURL = new URL(`${baseURL}?${searchParams.toString()}`)

    const response = await fetch(webRequestURL, requestInit)
    // const tabInfo = await chrome.tabs.get(tab.value?.id ?? 0)
    // console.info(await response.clone().text())
    console.info(`send tab id: ${tab.value?.id}`)
    const blob = await response.clone().blob()

    const reader = new FileReader()
    reader.addEventListener('loadend', () => {
      chrome.tabs.sendMessage(tab.value?.id ?? 0, reader.result)
    })

    reader.readAsText(blob, 'gb2312')
    // sendMessage(response.clone())
  }

  const onBeforeRequest = (detail: chrome.webRequest.WebRequestBodyDetails) => {
    // 如果`requestBody`不可用, 则尝试从url中提取参数.
    if (!detail.requestBody) {
      requestInit.body = new URLSearchParams(detail.url)
    }
    else {
      const { formData, raw } = detail.requestBody

      if (formData) {
        requestInit.body = literalObjectToFormData(formData)
      }
      else if (raw) {
        const bufferOrFile = raw
          // 不支持文件
          .map(({ bytes }) => {
            if (bytes) {
              return bytes
            }
            return null
          })
          .filter(item => !!item)

        requestInit.body = new Blob(bufferOrFile)
      }
    }
  }

  const onBeforeSendHeaders = (detail: chrome.webRequest.WebRequestHeadersDetails) => {
    url.value = detail.url
    requestInit.method = detail.method

    const headers = {}

    for (const header of detail.requestHeaders ?? []) {
      const { name, value } = header ?? {}
      if (!value) {
        continue
      }

      (headers as any)[name] = value
    }

    requestInit.headers = headers

    cloneRequest()
  }

  return {
    url,
    requestInit,
    enable,
    onBeforeRequest,
    onBeforeSendHeaders,
  }
}

const { onBeforeRequest, onBeforeSendHeaders } = useWebRequest()
// chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
//   urls: [target],
// }, ['requestBody'])

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {
  urls: [target],
}, ['requestHeaders', 'extraHeaders'])

async function buildConnection() {
  const tabs = await chrome.tabs.query({
    url: target,
  })
  const [t] = tabs ?? []
  tab.value = t ?? {}

  if (!t) {
    throw new Error(`无可用标签`)
  }
  else if (!t.id) {
    throw new Error(`标签id不可用`)
  }
}

// 只有在目标标签被激活时才能建立连接或者发送消息，否则会提示消息接受端不存在.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  activatedTabId.value = tabId

  if (activatedTabId.value === tab.value?.id) {
    console.info(`已切换到目标标签`)
  }

  if (tab.value) {
    return
  }
  await buildConnection()
  console.log('连接已初始化')
})

/**
 * 发送消息的包装函数
 * @param message 要发送的内容
 * @param type 使用`tabs.sendMessage()`一次性发送还是使用`connect.postMessage()`连接发送. 默认为`tab`
 */
async function sendMessage(message: unknown, type?: 'tab' | 'connect') {
  type ??= 'tab'

  if (!tab.value?.id) {
    await buildConnection()
  }

  if (!tab.value?.id || tab.value?.id !== activatedTabId.value) {
    return
  }

  if (type === 'tab') {
    chrome.tabs.sendMessage(tab.value.id, message)
  }
  else if (type === 'connect') {
    // 如果页面未加载完毕则会发送失败(提示接受端不存在)
    // TODO: 考虑包装为Promise
    chrome.tabs.connect(tab.value.id)?.postMessage(message)
  }
  else {
    throw new TypeError(`未知的类型: ${type}`)
  }
}
