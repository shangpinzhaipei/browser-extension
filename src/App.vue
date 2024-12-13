<script setup lang="ts">
import { ref, watch } from 'vue'
import { input } from './components'

const search = ref()
const test = ref()

watch(search, searchCustomerId)

function searchCustomerId() {
  // const table = document.querySelector('title')
  document.body.append('1231')
  test.value = document.querySelector('div')?.id
}
</script>

<template>
  <div>
    <input
      v-model="search"
      :class="input"
      type="text"
      placeholder="输入客户号"
    >
    <span>{{ test ?? "无" }}</span>
  </div>
</template>

<style>
#app {
  font-family:Arial, Helvetica, sans-serif;
  min-width: 300px;
}
</style>
