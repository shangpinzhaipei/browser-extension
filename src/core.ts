import { computed, reactive, ref } from 'vue'

const target = '*://admxt.yfway.com/*.php?*'

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
