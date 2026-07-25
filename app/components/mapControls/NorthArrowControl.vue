<template>
  <div class="map-bar map-control">
    <a id="alignNorth" title="North" href="#" @click.prevent="resetNorth">
      <svg
        ref="svgRef"
        viewBox="0 -6 100 110"
        class="north-arrow-icon"
        fill="currentColor"
      >
        <path
          d="M47.655 1.634l-35 95c-.828 2.24 1.659 4.255 3.68 2.98l33.667-21.228l33.666 21.228c2.02 1.271 4.503-.74 3.678-2.98l-35-95C51.907.514 51.163.006 50 .008c-1.163.001-1.99.65-2.345 1.626zm-.155 14.88v57.54L19.89 91.461z"
          fill-rule="evenodd"
        />
      </svg>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as Cesium from 'cesium'

const props = defineProps<{
  viewer: Cesium.Viewer
}>()

const svgRef = ref<SVGElement | null>(null)

// Post-render listener to update rotation based on camera heading
const updateRotation = () => {
  if (!svgRef.value || !props.viewer) return
  const heading = props.viewer.camera.heading
  const deg = -Cesium.Math.toDegrees(heading)
  svgRef.value.style.transformOrigin = '50% 50%'
  svgRef.value.style.transform = `rotate(${deg}deg)`
}

onMounted(() => {
  if (svgRef.value) {
    svgRef.value.style.transformOrigin = '50% 50%'
  }
  props.viewer.scene.postRender.addEventListener(updateRotation)
})

onBeforeUnmount(() => {
  if (props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.scene.postRender.removeEventListener(updateRotation)
  }
})

// Smoothly animate the camera back to North (heading 0)
const resetNorth = () => {
  const camera = props.viewer.camera
  const scene = props.viewer.scene

  const ray = new Cesium.Ray(camera.positionWC, camera.directionWC)
  const target = scene.globe.pick(ray, scene)
  if (!target) return

  const initialHeading = camera.heading
  const currentPitch = camera.pitch
  const currentRange = Cesium.Cartesian3.distance(camera.positionWC, target)

  const initialRemaining = Cesium.Math.negativePiToPi(0 - initialHeading)

  if (Math.abs(initialRemaining) < Cesium.Math.toRadians(1)) {
    return
  }

  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(target)

  camera.lookAtTransform(
    transform,
    new Cesium.HeadingPitchRange(initialHeading, currentPitch, currentRange)
  )

  const direction = initialRemaining > 0 ? -1 : 1
  const speed = 0.06 * direction
  let accumulated = 0

  const orbitTick = () => {
    const remaining = Math.abs(initialRemaining) - Math.abs(accumulated)

    if (remaining <= Cesium.Math.toRadians(0.5)) {
      props.viewer.clock.onTick.removeEventListener(orbitTick)

      camera.lookAtTransform(
        transform,
        new Cesium.HeadingPitchRange(0, currentPitch, currentRange)
      )

      camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
      return
    }

    camera.rotateRight(speed)
    accumulated += speed
  }

  props.viewer.clock.onTick.addEventListener(orbitTick)
}
</script>