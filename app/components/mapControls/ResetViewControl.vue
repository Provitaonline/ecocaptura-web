<template>
  <div class="map-bar map-control">
    <a href="#" :title="$t('map.reset_view')" :aria-label="$t('map.reset_view')" @click.prevent="resetView">
      <Icon name="mdi:crosshairs" class="map-reset-view-icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'
import { mapConfig } from '@/scripts/config'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const resetView = () => {
  const viewer = props.viewer
  if (!viewer) return

  viewer.camera.flyTo({
	destination: Cesium.Cartesian3.fromDegrees(
		mapConfig.defaultView.destination.longitude,
		mapConfig.defaultView.destination.latitude,
		mapConfig.defaultView.destination.height
	),
    orientation: mapConfig.defaultView.orientation,
    duration: 1.5
  })
}
</script>