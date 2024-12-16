<script setup lang="ts">
import { useDraggable } from '@vueuse/core'
// import {} from ''
import { onMounted, ref, watch } from 'vue'
import { input } from './components'
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
  <div id="container" ref="containerRef" :style="style" style="position: absolute;">
    <div>
      <textarea
        v-model="search"
        :class="input"
        type="text"
        placeholder="输入客户号"
      />
      <button>查询</button>
    </div>

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