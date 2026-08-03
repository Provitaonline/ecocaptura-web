<template>
  <div class="map-bar map-control">
    <a class="map-control-zoom-in" href="#" :title="$t('map.zoom_in')" :aria-label="$t('map.zoom_in')">+</a>
    <a class="map-control-zoom-out" href="#" :title="$t('map.zoom_out')" :aria-label="$t('map.zoom_out')">-</a>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  viewer: {
    type: Object,
    required: true
  }
})

let zoomInEl = null
let zoomOutEl = null
let zoomInHandler = null
let zoomOutHandler = null

const smoothMove = (distance, duration = 0.25) => {
  if (!props.viewer) return
  const start = performance.now()

  const step = (now) => {
    const t = (now - start) / (duration * 1000)
    if (t >= 1) return

    const eased = 1 - Math.pow(1 - t, 3)
    props.viewer.camera.moveForward(distance * eased * 0.1)

    requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

const getStep = () => {
  const height = props.viewer.camera.positionCartographic.height
  return height * 0.2
}

onMounted(() => {
  zoomInEl = document.querySelector('.map-control-zoom-in')
  zoomOutEl = document.querySelector('.map-control-zoom-out')

  zoomInHandler = (e) => {
    e.preventDefault()
    smoothMove(getStep())
  }

  zoomOutHandler = (e) => {
    e.preventDefault()
    smoothMove(-getStep())
  }

  zoomInEl?.addEventListener('click', zoomInHandler)
  zoomOutEl?.addEventListener('click', zoomOutHandler)
})

onUnmounted(() => {
  zoomInEl?.removeEventListener('click', zoomInHandler)
  zoomOutEl?.removeEventListener('click', zoomOutHandler)
})
</script>