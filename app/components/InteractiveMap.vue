<template>
  <div class="map-grid-map map-touch-wrapper">
    <div id="mapRoot">
        <div ref="cesiumContainer" id="cesiumContainer"></div>
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
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { Cartesian3, Ion, Math as CesiumMath, Terrain, Viewer, UrlTemplateImageryProvider } from 'cesium'
//import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

const config = useRuntimeConfig()

// Global configuration for Cesium assets
window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

let widget: Viewer | null = null;


onMounted(() => {
	widget = new Viewer('cesiumContainer', {
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
	(window as any).viewer = widget
});

onBeforeUnmount(() => {
  if (widget) {
    widget.destroy()
  }
})
</script>