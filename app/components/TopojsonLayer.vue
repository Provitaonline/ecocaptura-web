<script setup lang="ts">
import { onMounted, watch, onUnmounted, shallowRef } from 'vue'
import * as Cesium from 'cesium'
import { overlayLayers } from '@/scripts/map/overlays'
import { useMapLayers } from '@/composables/useMapLayers'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
	viewer: Cesium.Viewer
	nameKey: string
	visible?: boolean
}>(), {
	visible: false
})

const { t } = useI18n()
const { registerLayer } = useMapLayers()
const dataSourceRef = shallowRef<Cesium.GeoJsonDataSource | null>(null)
let unregister: (() => void) | null = null

onMounted(async () => {
	if (!props.viewer || props.viewer.isDestroyed()) return

	const layerMeta = overlayLayers.find((l) => l.nameKey === props.nameKey)
	if (!layerMeta || !layerMeta.url) {
		console.error(`TopoJSON URL not found for: ${props.nameKey}`)
		return
	}

  // Register the click handler 
  if (layerMeta.attribute) {
    unregister = registerLayer(async (cartesian: Cesium.Cartesian3) => {

		await new Promise(resolve => requestAnimationFrame(resolve))

		if (!props.visible || !dataSourceRef.value || !props.viewer || props.viewer.isDestroyed()) {
			return null
		}

		const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
		const clickLon = Cesium.Math.toDegrees(cartographic.longitude)
		const clickLat = Cesium.Math.toDegrees(cartographic.latitude)

		for (const entity of dataSourceRef.value.entities.values) {
			if (!entity.polygon || !entity.polygon.hierarchy) continue

			const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
			if (!hierarchy || !hierarchy.positions) continue

			const polygonCoords = hierarchy.positions.map((pos: Cesium.Cartesian3) => {
				const carto = Cesium.Cartographic.fromCartesian(pos)
				return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]
			})

			if (isPointInPolygon([clickLon, clickLat], polygonCoords)) {
				const attrValue = entity.properties?.[layerMeta.attribute as string]?.getValue()
				
				if (attrValue !== undefined && attrValue !== null) {
				return {
					title: t(layerMeta.nameKey),
					content: String(attrValue)
				}
				}
			}
		}
      return null
    })
  }

  // Load the TopoJSON data source asynchronously
  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(layerMeta.url, {
      clampToGround: true,
      fill: Cesium.Color.CYAN.withAlpha(0.01),
      stroke: undefined
    })

    dataSource.entities.values.forEach((entity) => {
		if (entity.polygon && entity.polygon.hierarchy) {
			entity.polygon.outline = undefined as any

			const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now())
			if (hierarchy && hierarchy.positions) {
				dataSource.entities.add({
				properties: entity.properties,
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
    console.error('Failed to load TopoJSON layer:', error)
  }
})

// Point-in-polygon helper
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
	const [x, y] = point
	let inside = false
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const pI = polygon[i] as [number, number] | undefined
		const pJ = polygon[j] as [number, number] | undefined
		if (!pI || !pJ) continue

		const [xi, yi] = pI
		const [xj, yj] = pJ

		const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
		if (intersect) inside = !inside
	}
  return inside
}

watch(() => props.visible, (newVal) => {
	if (dataSourceRef.value) {
		dataSourceRef.value.show = !!newVal
		props.viewer.scene.requestRender()
	}
})

onUnmounted(() => {
	if (unregister) {
		unregister()
		unregister = null
	}
	if (dataSourceRef.value && props.viewer && !props.viewer.isDestroyed()) {
		props.viewer.dataSources.remove(dataSourceRef.value, true)
		dataSourceRef.value = null
	}
})
</script>

<template></template>