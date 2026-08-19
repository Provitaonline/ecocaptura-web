<script setup lang="ts">
import { onMounted, watch, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import { MAP_CONFIG } from '@/scripts/config'

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  visible: boolean
  autoZoom?: boolean
}>(), {
  autoZoom: true
})

let dataSource: Cesium.GeoJsonDataSource | null = null

onMounted(async () => {
  if (!props.viewer) return

  try {
    dataSource = await Cesium.GeoJsonDataSource.load(MAP_CONFIG.areaOfInterestBoundaryFile, {
      clampToGround: true,
      stroke: Cesium.Color.ORANGE,
      strokeWidth: 2
    })

    props.viewer.dataSources.add(dataSource)
    dataSource.show = props.visible

    if (props.autoZoom) {
      props.viewer.flyTo(dataSource, { duration: 1.5 })
    }
  } catch (error) {
    console.error('Failed to load Area of Interest boundary:', error)
  }
})

watch(() => props.visible, (newVal) => {
  if (dataSource) {
    dataSource.show = newVal
  }
})

onUnmounted(() => {
  if (dataSource && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.dataSources.remove(dataSource, true)
  }
})
</script>

<template></template>