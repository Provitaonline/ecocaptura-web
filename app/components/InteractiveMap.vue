<template>
  <div class="map-grid-map map-touch-wrapper">
    <div id="mapRoot" style="position: relative;">
      
      <!-- Cesium canvas -->
      <div id="cesiumContainer"></div>

	  <AreaOfInterestBoundary v-if="widget" :viewer="widget" :visible="true" />

      <!-- Controls overlay (only renders once widget is ready) -->
      <div class="map-top map-right" v-if="widget">
		<NorthArrowControl :viewer="widget" />
        <ZoomControl :viewer="widget" />
		<LookDownControl :viewer="widget" />
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
import { Ion, Terrain, Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import ZoomControl from './mapControls/ZoomControl.vue'
import NorthArrowControl from './mapControls/NorthArrowControl.vue'
import LookDownControl from './mapControls/LookDownControl.vue'
import AreaOfInterestBoundary from './AreaOfInterestBoundary.vue'

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

const config = useRuntimeConfig()

window.CESIUM_BASE_URL = '/cesium/'
Ion.defaultAccessToken = config.public.cesiumIonToken

// Make widget a ref so the template can react when it initializes
const widget = ref<Viewer | null>(null)

onMounted(() => {
    widget.value = new Viewer('cesiumContainer', {
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
    (window as any).viewer = widget.value


	
});

onBeforeUnmount(() => {
  if (widget.value) {
    widget.value.destroy()
  }
})
</script>