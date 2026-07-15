<template>
  <div ref="cesiumContainer" class="globe-wrapper"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { Ion, CesiumWidget, Terrain } from '@cesium/engine'
import '@cesium/engine/Source/Widget/CesiumWidget.css'


const config = useRuntimeConfig()

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

const cesiumContainer = ref<HTMLElement | null>(null)
let widget: CesiumWidget | null = null

onMounted(() => {
  if (cesiumContainer.value) {
    widget = new CesiumWidget(cesiumContainer.value, {
      terrain: Terrain.fromWorldTerrain(),
    })
  }
});

onBeforeUnmount(() => {
  if (widget) {
    widget.destroy()
  }
});
</script>

<style scoped>
.globe-wrapper {
  width: 100%;
  height: 100%;
}
</style>