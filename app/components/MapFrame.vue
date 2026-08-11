<template>
  <div class="main-layout">
    <SidePanel 
      class="sidebar" 
      @update:captures="(list) => captureList = list"
      @select-capture="handleSelectCapture"
    />

    <div class="map-wrapper">
      <InteractiveMap 
        ref="mapRef"
        :captures="captureList" 
      />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: calc(100vh - 10rem);
  overflow: hidden;
}

.sidebar {
  width: 20rem;
  flex-shrink: 0;
  overflow-y: auto;
}

.map-wrapper {
  flex-grow: 1; 
  min-width: 0; 
  min-height: 0; 
  position: relative;
  transition: none !important;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    height: 100vh; 
  }

  .sidebar {
    width: 100%;
    height: auto; 
    max-height: 40vh;
  }

  .map-wrapper {
    flex-grow: 1;
    min-height: 300px;
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import type { Capture } from '@/scripts/data/captures'

const captureList = ref<Capture[]>([])
const mapRef = ref<any>(null)

function handleSelectCapture(item: Capture) {
  if (item.expanded && item.centroidCoordinates && mapRef.value) {
    mapRef.value.flyToCapture(item.centroidCoordinates)
  }
}
</script>