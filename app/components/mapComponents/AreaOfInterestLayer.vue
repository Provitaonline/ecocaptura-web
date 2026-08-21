<script setup lang="ts">
import { onMounted, watch, onUnmounted, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import { overlayLayers } from '@/scripts/map/overlays'

const props = defineProps<{
    viewer: Cesium.Viewer
    nameKey: string
    visible?: boolean
}>()

const primitiveRef = shallowRef<Cesium.GroundPolylinePrimitive | null>(null)

onMounted(async () => {
    if (!props.viewer || props.viewer.isDestroyed()) return

    const layerMeta = overlayLayers.find((l) => l.nameKey === props.nameKey)
    if (!layerMeta || !layerMeta.url) {
        console.error(`AOI URL not found for nameKey: ${props.nameKey}`)
        return
    }

    const layerColor = layerMeta.color 
        ? Cesium.Color.fromCssColorString(layerMeta.color) 
        : Cesium.Color.CYAN

    try {
        const response = await fetch(layerMeta.url)
        if (!response.ok) throw new Error(`Failed to load ${layerMeta.url}: ${response.statusText}`)
        
        const prebakedBorders = await response.json() as number[][]

        // Create geometry instances with per-instance color attributes required by PolylineColorAppearance
        const instances = prebakedBorders.map((packedArray) => {
            const positions = Cesium.Cartesian3.unpackArray(packedArray)
            return new Cesium.GeometryInstance({
                geometry: new Cesium.GroundPolylineGeometry({
                    positions: positions,
                    width: 1.0
                }),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(layerColor)
                }
            })
        })

        if (props.viewer.isDestroyed()) return

        const primitive = new Cesium.GroundPolylinePrimitive({
            geometryInstances: instances,
            appearance: new Cesium.PolylineColorAppearance(),
            show: props.visible ?? true
        })

        props.viewer.scene.groundPrimitives.add(primitive)
        primitiveRef.value = primitive

        props.viewer.scene.requestRender()
    } catch (error) {
        console.error('Failed to load pre-baked AOI primitive layer:', error)
    }
})

watch(() => props.visible, (newVal) => {
    if (primitiveRef.value) {
        primitiveRef.value.show = newVal ?? true
        props.viewer.scene.requestRender()
    }
})

onUnmounted(() => {
    if (primitiveRef.value && props.viewer && !props.viewer.isDestroyed()) {
        props.viewer.scene.groundPrimitives.remove(primitiveRef.value)
        primitiveRef.value = null
    }
})
</script>

<template></template>