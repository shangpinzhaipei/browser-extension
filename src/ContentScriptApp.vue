<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
// import {} from ''
import { onMounted, ref, watch } from 'vue'
import { badge, button, input } from './components'
import Button from './components/Button.vue'
import IconDrag from './icons/IconDrag.vue'
import IconHide from './icons/IconHide.vue'
import IconSettings from './icons/IconSettings.vue'
import { type Data, type Header, useCoreData } from './store/useCoreData'

const { init, queryCustomer } = useCoreData()
const containerRef = ref<HTMLElement>()
const dragHandleRef = ref<HTMLElement>()

const { style } = useDraggable(containerRef, {
  handle: dragHandleRef,
  initialValue: {
    x: 0,
    y: 0,
  },
})
const search = ref()
const data = ref<Data[]>([])
const headers = ref<Header[]>([])
const customerIds = ref<string[]>([])
const isShow = ref(true)

watch(search, searchCustomerId)

function searchCustomerId() {
  if (!search.value)
    return
  const [result, h, ids] = queryCustomer(search.value)
  data.value = result
  headers.value = h
  customerIds.value = ids
}

function onClipboardPaste(event: ClipboardEvent) {
  search.value = null

  const clipboardData = event.clipboardData
  if (clipboardData) {
    const pastedData = clipboardData.getData('text')
    const [result, h, ids] = queryCustomer(pastedData)
    data.value = result
    headers.value = h
    customerIds.value = ids
  }
}

onMounted(() => {
  // 如果页面路径包含index.html，则不显示
  isShow.value = !location.pathname.includes('index.html')
  init()
})
</script>

<template>
  <div
    v-if="isShow"
    id="container"
    ref="containerRef"
    class="absolute p-4"
    :style="style"
    @paste="onClipboardPaste"
  >
    <header class="grid gap-2 grid-cols-[repeat(5,_min-content)] py-2 items-center">
      <input
        v-model="search"
        type="text"
        :class="input"
        class="min-w-40"
        placeholder="手动输入单个客户号"
      >

      <Button ref="dragHandleRef" style="cursor: move;">
        <IconDrag />
      </Button>
      <Button>
        <IconHide />
      </Button>
      <Button>
        <IconSettings />
      </Button>
      <span :class="badge" class="whitespace-nowrap text-white">可用</span>
    </header>

    <el-table :data="data" style="width: 100%">
      <el-table-column
        v-for="(h, index) in headers"
        :key="index"
        :prop="h"
        :label="h"
      />
    </el-table>
  </div>
</template>

<style>
#container {
  font-family:Arial, Helvetica, sans-serif;
  min-height: 300px;
  min-width: fit-content;
  outline: 1px solid red;
  border-radius: 0.5rem;
  background-color: white;
  resize: both;

  z-index: 9999;
}
</style>
