<template>
  <div
    ref="controlRef"
    id="layerControl"
    title="Basemaps & overlays"
    class="map-control map-control-layers"
    :class="{ 'map-control-layers-expanded': isExpanded }"
    aria-haspopup="true"
  >
    <a class="map-control-layers-toggle" href="#" @click="toggleDropdown"></a>

    <form class="map-control-layers-list" @submit.prevent>
      <div id="basemap-layer-control" class="map-control-layers-base">
        <label v-for="(provider, index) in imageryProviders" :key="index">
          <input
            type="radio"
            class="basemap-layer map-control-layers-selector"
            name="map-base-layers"
            :value="index"
            :checked="selectedIndex === index"
            @change="handleRadioChange(index)"
          />
          <span> &nbsp;{{ provider.name }}</span>
        </label>
      </div>
    </form>
  </div>
</template>

<style scoped>
.map-control-layers-base span {
  display: inline-block;
  transform: translateY(-1px);
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { imageryProviders } from '@/scripts/map/basemaps'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const isExpanded = ref(false)
const selectedIndex = ref(0)
let controlRef = ref<HTMLElement | null>(null)

function switchBasemap(index: number) {
  if (!props.viewer || props.viewer.isDestroyed()) return
  const layers = props.viewer.imageryLayers

  // Remove all existing imagery layers
  while (layers.length > 0) {
    layers.remove(layers.get(0), true)
  }

  // Add all providers for the selected basemap
  const basemap = imageryProviders[index]
  if (basemap && basemap.providers) {
    basemap.providers.forEach(providerFn => {
      layers.addImageryProvider(providerFn())
    })
  }
}

function handleRadioChange(index: number) {
  selectedIndex.value = index
  switchBasemap(index)
  isExpanded.value = false
}

function toggleDropdown(e: MouseEvent) {
  e.preventDefault()
  isExpanded.value = !isExpanded.value
}

// Close when clicking outside the component
function handleClickOutside(e: MouseEvent) {
  if (controlRef.value && !controlRef.value.contains(e.target as Node)) {
    isExpanded.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>