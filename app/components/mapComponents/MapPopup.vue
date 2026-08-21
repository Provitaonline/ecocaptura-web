<template>
  <div 
    ref="rootRef"
    class="map-popup" 
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <button class="popup-close" @click="$emit('close')">&times;</button>
    
    <div v-for="(item, index) in results" :key="index" class="popup-item">
      <div class="popup-title">{{ item.title }}</div>
      <div class="popup-content">{{ item.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">

const rootRef = ref<HTMLElement | null>(null)

defineProps<{
  x: number
  y: number
  results: Array<{ title: string; content: string }>
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ESC key handler
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  contains: (node: Node) => rootRef.value?.contains(node)
})
</script>

<style scoped>
.map-popup {
  position: absolute;
  transform: translate(-50%, -100%);
  margin-top: -12px; /* Pulls it slightly above the clicked point */
  background: white;
  border-radius: 6px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  font-size: 13px;
  z-index: 1000;
  min-width: 200px;
  pointer-events: auto;
}

.popup-close {
  position: absolute;
  top: 4px;
  right: 8px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.popup-close:hover {
  color: #111;
}

.popup-item + .popup-item {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.popup-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 2px;
}

.popup-content {
  color: #555;
}
</style>