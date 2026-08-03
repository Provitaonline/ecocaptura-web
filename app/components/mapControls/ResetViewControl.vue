<template>
  <div class="map-bar map-control">
    <a href="#" :title="$t('map.reset_view')" :aria-label="$t('map.reset_view')" @click.prevent="resetView">
      <Icon name="mdi:crosshairs" class="map-reset-view-icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'
import { MAP_CONFIG } from '@/scripts/config'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const resetView = () => {
  const viewer = props.viewer
  if (!viewer) return

  viewer.camera.flyTo({
	destination: Cesium.Cartesian3.fromDegrees(
		MAP_CONFIG.defaultView.destination.longitude,
		MAP_CONFIG.defaultView.destination.latitude,
		MAP_CONFIG.defaultView.destination.height
	),
    orientation: MAP_CONFIG.defaultView.orientation,
    duration: 1.5
  })
}
</script>