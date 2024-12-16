<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
// import {} from ''
import { onMounted, ref, watch } from 'vue'
import { badge, button, input } from './components'
import IconDrag from './icons/IconDrag.vue'
import IconHide from './icons/IconHide.vue'
import IconSettings from './icons/IconSettings.vue'
import { type Data, type Header, useCoreData } from './store/useCoreData'

const { init, queryCustomer } = useCoreData()
const containerRef = ref<HTMLElement>()

const { style } = useDraggable(containerRef, {
  initialValue: {
    x: 0,
    y: 0,
  },
})
const search = ref()
const data = ref<Data[]>([])
const headers = ref<Header[]>([])

watch(search, searchCustomerId)

function searchCustomerId() {
  const [result, h] = queryCustomer(search.value)
  data.value = result
  headers.value = h
}

onMounted(() => {
  init()
})
</script>

<template>
  <header id="container" ref="containerRef" class="p-4" :style="style" style="position: absolute;">
    <div class="grid gap-2 grid-cols-[repeat(5,_min-content)] py-2">
      <input
        v-model="search"
        type="text"
        :class="input"
        class="min-w-40"
        placeholder="输入客户号"
      >
      <span :class="badge" class="whitespace-nowrap text-white">可用</span>

      <button :class="button">
        <IconHide />
      </button>

      <button :class="button">
        <IconSettings />
      </button>

      <button :class="button">
        <IconDrag />
      </button>
    </div>

    <el-table :data="data" style="width: 100%">
      <el-table-column
        v-for="(h, index) in headers"
        :key="index"
        :prop="h"
        :label="h"
      />
    </el-table>
  </header>
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
