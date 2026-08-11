<template>
  <div class="map-grid-map map-touch-wrapper">
    <div id="mapRoot" style="position: relative;">
      
		<!-- Cesium canvas -->
		<div id="cesiumContainer"></div>

		<AreaOfInterestBoundary v-if="viewer" :viewer="viewer" :visible="overlayStates['aoi'] ?? true" :autoZoom="false" />

		<!-- Controls overlay (only renders once viewer is ready) -->
		<div class="map-top map-right" v-if="viewer">
			<NorthArrowControl :viewer="viewer" />
			<ZoomControl :viewer="viewer" />
			<LookDownControl :viewer="viewer" />
			<ResetViewControl :viewer="viewer" />
			<LayerControl :viewer="viewer" @update:overlay="handleOverlayUpdate" />
		</div>

    </div>
  </div>
</template>

<style scoped>
.map-grid-map {
    height: 100%;
    min-height: 0; /* The magic link in the chain */
    position: relative;
}

#mapRoot {
    position: relative;
    height: 100%;
    width: 100%;
}

#cesiumContainer {
    position: absolute;
    inset: 0;
    overflow: hidden;
}

</style>

<script setup lang="ts">
import '@/assets/css/map.css'
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { Ion, Terrain, Viewer, Cartesian3, Color, HeightReference, VerticalOrigin } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import ZoomControl from './mapControls/ZoomControl.vue'
import NorthArrowControl from './mapControls/NorthArrowControl.vue'
import LookDownControl from './mapControls/LookDownControl.vue'
import AreaOfInterestBoundary from './AreaOfInterestBoundary.vue'
import LayerControl from './mapControls/LayerControl.vue'
import ResetViewControl from './mapControls/ResetViewControl.vue'
import { MAP_CONFIG } from '@/scripts/config'
import { reactive } from 'vue'
import { overlayLayers } from '@/scripts/map/overlays'

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

const config = useRuntimeConfig()

window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

const props = defineProps<{
  captures?: any[]
}>()

// Make viewer a ref so the template can react when it initializes
const viewer = ref<Viewer | null>(null)

const overlayStates = reactive<Record<string, boolean>>(
  Object.fromEntries(overlayLayers.map(layer => [layer.id, layer.defaultVisible]))
)

function handleOverlayUpdate(id: string, visible: boolean) {
  overlayStates[id] = visible
}

onMounted(() => {
    viewer.value = new Viewer('cesiumContainer', {
        baseLayerPicker: false,
        animation: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        terrain: Terrain.fromWorldTerrain(),
        // @ts-ignore
        terrainExaggeration: 2
    });

	viewer.value.camera.setView({
        destination: Cartesian3.fromDegrees(
            MAP_CONFIG.defaultView.destination.longitude,
            MAP_CONFIG.defaultView.destination.latitude,
            MAP_CONFIG.defaultView.destination.height
        ),
        orientation: MAP_CONFIG.defaultView.orientation
    })

    ;(window as any).viewer = viewer.value
	
});

onBeforeUnmount(() => {
  if (viewer.value) {
    viewer.value.destroy()
  }
})

// Watch for capture list updates to add markers to the Cesium globe
watch(() => props.captures, (newCaptures) => {
	if (!viewer.value || !newCaptures) return

	newCaptures.forEach(item => {
		if (!item.centroidCoordinates) return

		const parts = item.centroidCoordinates.split(',').map(Number)
		const lat = parts[0]
		const lng = parts[1]

		if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
			viewer.value?.entities.add({
			position: Cartesian3.fromDegrees(lng, lat),
			billboard: {
				image: '/images/blue_marker.png',
				scale: 1.0,
				heightReference: HeightReference.CLAMP_TO_GROUND,
				verticalOrigin: VerticalOrigin.BOTTOM
			},
			properties: { captureId: item.captureId }
			});
		}
	})
}, { deep: true })

// Expose camera fly-to function for parent calls
function flyToCapture(centroidString: string) {
	if (!viewer.value || !centroidString) return
	const parts = centroidString.split(',').map(Number)
	const lat = parts[0]
	const lng = parts[1]

	if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
	viewer.value?.camera.flyTo({
		destination: Cartesian3.fromDegrees(lng, lat, 15000),
		duration: 1.5
	})
	}
}

defineExpose({ flyToCapture })
</script>