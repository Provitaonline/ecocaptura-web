<template>
  <div class="map-bar map-control">
    <a href="#" :title="$t('map.look_down')" :aria-label="$t('map.look_down')" @click.prevent="lookDown">
      <Icon name="mdi:arrow-down-circle" class="map-look-down-icon" />
    </a>
  </div>
</template>

<script setup lang="ts">
import * as Cesium from 'cesium'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const lookDown = () => {
  const viewer = props.viewer
  if (!viewer) return

  const scene = viewer.scene
  const camera = viewer.camera

  const ray = new Cesium.Ray(camera.positionWC, camera.directionWC)
  const target = scene.globe.pick(ray, scene)
  if (!target) return

  const camCarto = Cesium.Cartographic.fromCartesian(camera.positionWC)

  camera.flyToBoundingSphere(
    new Cesium.BoundingSphere(target, 1),
    {
      offset: new Cesium.HeadingPitchRange(
        0,                           // snap north
        Cesium.Math.toRadians(-90),  // tilt down
        camCarto.height              // keep same height
      ),
      duration: 1.5
    }
  )
}
</script>