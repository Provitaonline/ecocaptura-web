<script setup lang="ts">
import { onMounted, watch, onUnmounted, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import { overlayLayers } from '@/scripts/map/overlays'

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  nameKey: string
  visible?: boolean
}>(), {
  visible: false
})

const dataSourceRef = shallowRef<Cesium.GeoJsonDataSource | null>(null)

onMounted(async () => {
  if (!props.viewer || props.viewer.isDestroyed()) return

  const layerMeta = overlayLayers.find((l) => l.nameKey === props.nameKey)
  if (!layerMeta || !layerMeta.url) {
    console.error(`TopoJSON URL not found for: ${props.nameKey}`)
    return
  }

  try {
    // Load without stroke so the parser doesn't trigger the terrain outline restriction
    const dataSource = await Cesium.GeoJsonDataSource.load(layerMeta.url, {
      clampToGround: true,
      fill: Cesium.Color.CYAN.withAlpha(0.01)
    })

    // Explicitly add clean ground-clamped polylines for every polygon boundary
    dataSource.entities.values.forEach((entity) => {
      if (entity.polygon && entity.polygon.hierarchy) {
        // Ensure no outline property is accidentally set
        entity.polygon.outline = undefined as any

        const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
        if (hierarchy && hierarchy.positions) {
          dataSource.entities.add({
            polyline: {
              positions: hierarchy.positions,
              width: 1,
              material: Cesium.Color.CYAN,
              clampToGround: true
            }
          })
        }
      }
    })

    if (props.viewer.isDestroyed()) return

    await props.viewer.dataSources.add(dataSource)
    dataSource.show = !!props.visible
    
    dataSourceRef.value = dataSource
    props.viewer.scene.requestRender()
  } catch (error) {
    console.error('Failed to load TopoJSON:', error)
  }
})

watch(() => props.visible, (newVal) => {
  if (dataSourceRef.value) {
    dataSourceRef.value.show = !!newVal
    props.viewer.scene.requestRender()
  }
})

onUnmounted(() => {
  if (dataSourceRef.value && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.dataSources.remove(dataSourceRef.value, true)
    dataSourceRef.value = null
  }
})
</script>

<template></template>