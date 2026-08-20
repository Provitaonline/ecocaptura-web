<script setup lang="ts">
import { onMounted, watch, onUnmounted, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import CesiumMVTImageryProvider from 'cesium-mvt-imagery-provider'
import { overlayLayers } from '@/scripts/map/overlays'

const props = withDefaults(defineProps<{
  viewer: Cesium.Viewer
  nameKey: string
  visible?: boolean
}>(), {
  visible: false
})

watch(() => props.visible, (newVal) => {
  console.log(`[MVTTilesetLayer] Prop 'visible' changed for ${props.nameKey}:`, newVal)
}, { immediate: true })

const imageryLayerRef = shallowRef<Cesium.ImageryLayer | null>(null)

onMounted(async () => {
  if (!props.viewer || props.viewer.isDestroyed()) return

  const layerMeta = overlayLayers.find((l) => l.nameKey === props.nameKey)
  if (!layerMeta || !layerMeta.url) {
    console.error(`MVT URL not found for: ${props.nameKey}`)
    return
  }

  try {
    const provider = new CesiumMVTImageryProvider({
      urlTemplate: layerMeta.url,
      layerName: 'limites_estadales_de_venezuela_igvsb_wgs84',
	  maximumLevel: 30,
      style: (_feature: any) => ({
        strokeStyle: '#00FFFF',
        lineWidth: 1,
        fillStyle: 'rgba(0, 255, 255, 0.01)'
      }),
      credit: 'IGVSB'
    })

    if ((provider as any).readyPromise) {
      await (provider as any).readyPromise
    }

    if (props.viewer.isDestroyed()) return

    const layer = props.viewer.scene.imageryLayers.addImageryProvider(provider as any)
    layer.show = !!props.visible

	layer.minificationFilter = Cesium.TextureMinificationFilter.LINEAR;
    layer.magnificationFilter = Cesium.TextureMagnificationFilter.LINEAR;


    imageryLayerRef.value = layer

    props.viewer.scene.requestRender()
  } catch (error) {
    console.error('Failed to load MVT provider:', error)
  }
})

watch(() => props.visible, (newVal) => {
  if (imageryLayerRef.value && props.viewer && !props.viewer.isDestroyed()) {
    imageryLayerRef.value.show = !!newVal
    props.viewer.scene.requestRender()
  }
})

onUnmounted(() => {
  if (imageryLayerRef.value && props.viewer && !props.viewer.isDestroyed()) {
    props.viewer.scene.imageryLayers.remove(imageryLayerRef.value, true)
    imageryLayerRef.value = null
    props.viewer.scene.requestRender()
  }
})
</script>

<template></template>