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
    dataSource = await Cesium.GeoJsonDataSource.load(MAP_CONFIG.areaOfInterestBoundaryFile)

    const entities = dataSource.entities.values
    for (const entity of entities) {
      if (entity.polygon && entity.polygon.hierarchy) {
        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
        if (hierarchy && hierarchy.positions) {
          dataSource.entities.add({
            polyline: {
              positions: hierarchy.positions,
              clampToGround: true,
              material: Cesium.Color.ORANGE,
              width: 2
            }
          })
        }

        // Disable original polygon visuals
        entity.polygon.fill = new Cesium.ConstantProperty(false)
        entity.polygon.outline = new Cesium.ConstantProperty(false)
      }
    }

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

<template>
  <!-- Functional map layer component -->
</template>