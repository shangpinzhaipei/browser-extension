import { computed, reactive, ref } from 'vue'

const target = import.meta.env.VITE_TARGET_BASE_URL + import.meta.env.VITE_TARGET_PATH

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
    if (!URL.canParse(url.value)) {
      return false
    }

    const baseURL = new URL(url.value)

    return !/ajax/i.test(baseURL.pathname) && !baseURL.searchParams.has('webRequest', '1')
  })

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
  }

  const onResponseStarted = async () => {
    if (!enable.value) {
      return
    }
    const [baseURL] = url.value.split('?')
    const searchParams = new URL(url.value).searchParams
    searchParams.append('webRequest', '1')

    const webRequestURL = new URL(`${baseURL}?${searchParams.toString()}`)

    const response = await fetch(webRequestURL, requestInit)
    const text = await response.text()
  }

  return {
    url,
    requestInit,
    enable,
    onBeforeRequest,
    onBeforeSendHeaders,
    onResponseStarted,
  }
}

const { onBeforeRequest, onBeforeSendHeaders, onResponseStarted } = useWebRequest()
// chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
//   urls: [target],
// }, ['requestBody'])

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, {
  urls: [target],
}, ['requestHeaders', 'extraHeaders'])

chrome.webRequest.onResponseStarted.addListener(onResponseStarted, {
  urls: [target],
})

const tab = ref<chrome.tabs.Tab>()
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
  sendMessage(tabId, { message: 'fk' }, 'connect')
  if (tab.value) {
    return
  }
  await buildConnection()
  console.log('连接已初始化')
})

function sendMessage(tabId: number, message: unknown, type?: 'tab' | 'connect') {
  type ??= 'tab'

  if (tab.value?.id !== tabId) {
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
