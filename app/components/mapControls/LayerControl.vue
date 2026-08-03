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
      
      <!-- Basemaps -->
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

      <!-- Separator -->
      <div class="map-control-layers-separator"></div>

      <!-- Overlays Section -->
      <div id="overlay-layer-control" class="map-control-layers-overlays">
        <label v-for="layer in overlayState" :key="layer.id">
          <input
            type="checkbox"
            class="map-control-layers-selector"
            v-model="layer.visible"
            @change="handleOverlayToggle(layer)"
          />
		  <span class="map-control-layers-label"> &nbsp;{{ $t(layer.nameKey) }}</span>
        </label>
      </div>

    </form>
  </div>
</template>

<style scoped>


</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { imageryProviders } from '@/scripts/map/basemaps'
import { overlayLayers } from '@/scripts/map/overlays'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const emit = defineEmits<{
  (e: 'update:overlay', id: string, visible: boolean): void
}>()

const isExpanded = ref(false)
const selectedIndex = ref(0)
let controlRef = ref<HTMLElement | null>(null)

const overlayState = ref(
  overlayLayers.map(layer => ({
    ...layer,
    visible: layer.defaultVisible
  }))
)

function switchBasemap(index: number) {
  if (!props.viewer || props.viewer.isDestroyed()) return
  const layers = props.viewer.imageryLayers

  while (layers.length > 0) {
    layers.remove(layers.get(0), true)
  }

  const basemap = imageryProviders[index]
  if (basemap && basemap.providers) {
    basemap.providers.forEach(providerFn => {
      layers.add(providerFn())
    })
  }
}

function handleRadioChange(index: number) {
  selectedIndex.value = index
  switchBasemap(index)
  isExpanded.value = false
}

function handleOverlayToggle(layer: typeof overlayState.value[number]) {
  if (!props.viewer || props.viewer.isDestroyed()) return
  emit('update:overlay', layer.id, layer.visible)
}

function toggleDropdown(e: MouseEvent) {
  e.preventDefault()
  isExpanded.value = !isExpanded.value
}

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