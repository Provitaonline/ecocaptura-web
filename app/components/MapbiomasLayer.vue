<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue'
import * as Cesium from 'cesium'

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  visible: boolean
  autoZoom?: boolean
}>(), {
  autoZoom: false
})

let imageryLayer: Cesium.ImageryLayer | null = null

onMounted(async () => {
  if (!props.viewer) return

  try {
    const provider = await Cesium.IonImageryProvider.fromAssetId(5142266)
    imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Promise.resolve(provider))
    
    props.viewer.imageryLayers.add(imageryLayer)
    imageryLayer.show = props.visible

    if (props.autoZoom && imageryLayer) {
      // Optional: zoom to imagery extent if desired
    }
  } catch (error) {
    console.error('Failed to load MapBiomas imagery layer:', error)
  }
})

watch(() => props.visible, (newVal) => {
  if (imageryLayer) {
    imageryLayer.show = newVal
  }
})

onUnmounted(() => {
  if (imageryLayer && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.imageryLayers.remove(imageryLayer, true)
  }
})
</script>

<template>
  <!-- Functional map layer component -->
</template>