<template>
  <div
    ref="controlRef"
    id="layerControl"
    :title="$t('map.layer')" :aria-label="$t('map.layer')"
    class="map-control map-control-layers"
    :class="{ 'map-control-layers-expanded': isExpanded }"
    aria-haspopup="true"
  >
    <a class="map-control-layers-toggle" href="#" @click="toggleDropdown">
        <Icon name="mdi:layers" class="map-layer-icon" />
    </a>
    

    <div class="map-control-layers-list">
      
      <!-- Basemaps -->
      <div id="basemap-layer-control" class="map-control-layers-base">
        <div
          v-for="(provider, index) in imageryProviders" 
          :key="index"
          class="map-layer-item"
          :class="{ 'is-active': selectedIndex === index }"
          @click="handleBasemapClick(index)"
        >
          <span>{{ $t(provider.nameKey) }}</span>
        </div>
      </div>

      <!-- Separator -->
      <div class="map-control-layers-separator"></div>

      <!-- Overlays Section -->
      <div id="overlay-layer-control" class="map-control-layers-overlays">
        <div 
          v-for="layer in overlayState" 
          :key="layer.id"
          class="map-layer-item"
          :class="{ 'is-active': layer.visible }"
          @click="handleOverlayClick(layer)"
        >
          <span class="map-control-layers-label">{{ $t(layer.nameKey) }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.map-layer-item {
  cursor: pointer;
  padding: 4px 8px;
  user-select: none;
  transition: color 0.15s ease;
}

/* Style for active / selected selections */
.map-layer-item.is-active {
  font-weight: bold;
}

/* Hover feedback */
.map-layer-item:hover {
  opacity: 0.8;
}
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

function handleBasemapClick(index: number) {
  selectedIndex.value = index
  switchBasemap(index)
  isExpanded.value = false
}

function handleOverlayClick(layer: typeof overlayState.value[number]) {
  layer.visible = !layer.visible
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