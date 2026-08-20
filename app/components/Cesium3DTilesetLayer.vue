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

const tilesetRef = shallowRef<Cesium.Cesium3DTileset | null>(null)

onMounted(async () => {
  console.log('3DTileSetLayer mounted, viewer exists:', !!props.viewer, 'nameKey:', props.nameKey)

  if (!props.viewer || props.viewer.isDestroyed()) {
    console.warn('Viewer is missing or destroyed!')
    return
  }

  const layerMeta = overlayLayers.find((l) => l.nameKey === props.nameKey)
  console.log('Found layerMeta:', layerMeta)

  if (!layerMeta || !layerMeta.ionAssetId) {
    console.error(`3D Tileset layer configuration or ionAssetId not found for: ${props.nameKey}`)
    return
  }

  try {
    console.log(`Fetching ion asset ID: ${layerMeta.ionAssetId}`)
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(layerMeta.ionAssetId, {
      enableCollision: true,
      scene: props.viewer.scene
    })    
    if (props.viewer.isDestroyed()) return

    const addedTileset = props.viewer.scene.primitives.add(tileset)
    tilesetRef.value = addedTileset
    addedTileset.show = props.visible

    addedTileset.style = new Cesium.Cesium3DTileStyle({
      color: 'color("cyan", 0.1)',
      show: true
    })

    console.log('3D Tileset successfully added to scene!')
  } catch (error) {
    console.error(`Failed to load 3D Tileset for (${props.nameKey}):`, error)
  }
})

watch(() => props.visible, (newVal) => {
  if (tilesetRef.value) {
    tilesetRef.value.show = newVal
  }
})

onUnmounted(() => {
  if (tilesetRef.value && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.scene.primitives.remove(tilesetRef.value)
    tilesetRef.value = null
  }
})
</script>

<template></template>