import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type Header = '客户号' | '下单完毕日期' | '状态' | ({} & string)

export type Data = Record<Header, string | undefined>

export const useCoreData = defineStore('coreData', () => {
  const table = ref<HTMLTableElement | null>()
  const data = ref<Data[]>([])
  const headers = ref<(string | undefined)[]>()

  function tableRowToArray(row: HTMLTableRowElement) {
    if (!row) {
      return []
    }

    const cells = Array.from(row.cells).map(cell => cell.textContent?.trim())
    return cells
  }

  async function set(msg: string) {
    const document = new DOMParser().parseFromString(msg, 'text/html')
    const tableElement = document.querySelector('.xlslike') as HTMLTableElement

    if (!tableElement) {
      return
    }

    table.value = tableElement

    const collection = table.value?.rows
    const [header, ...body] = Array.from(collection)

    if (!header) {
      return
    }

    const parsedHeaders = tableRowToArray(header)
    const result = body.map((value) => {
      const parsedBody = tableRowToArray(value)
      const obj = {} as Data
      parsedHeaders.forEach((key, index) => {
        if (!key) {
          console.error(`表格头不可用: ${key}`)
          return
        }

        obj[key] = parsedBody[index]
      })
      return obj
    })

    data.value = result
    headers.value = parsedHeaders
  }

  function queryCustomer(id: string[] | string, headers?: Header[]) {
    headers ??= ['客户号', '状态', '下单完毕日期']

    function parser(ids: string = '') {
      return ids.split('\n').map(id => id.trim())
    }

    const parsedIds = Array.isArray(id) ? id : parser(id)

    const filters = data.value
      .filter(item => parsedIds.includes(item['客户号'] ?? ''))
      .map((item) => {
        const f = {} as Data
        for (const header of headers) {
          f[header] = item[header]
        }

        return f
      })

    return [filters, headers, parsedIds] as const
  }

  function init() {
    chrome.runtime.onMessage.addListener(set)
  }

  return { init, headers, queryCustomer }
})
