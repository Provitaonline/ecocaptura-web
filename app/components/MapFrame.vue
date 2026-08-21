<template>
  <div class="main-layout">
    <SidePanel 
		ref="sidePanelRef"
      	class="sidebar" 
		@update:filtered-captures="(list: Capture[]) => filteredCaptures = list"
		@select-capture="handleSelectCapture"
		@toggle-capture-photos="handleToggleCapturePhotos"
		@open-lightbox="openLightbox"
    />

    <div class="map-wrapper">
      <InteractiveMap 
        ref="mapRef"
        :captures="filteredCaptures" 
        @open-lightbox="openLightbox"
		@open-capture="handleOpenCaptureCard"
      />
    </div>

    <LightboxModal 
      :photo="selectedPhoto"
      @close="closeLightbox"
    />
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: calc(100vh - 10rem);
  overflow: hidden;
}

.sidebar {
  width: 20rem;
  flex-shrink: 0;
  overflow-y: auto;
}

.map-wrapper {
  flex-grow: 1; 
  min-width: 0; 
  min-height: 0; 
  position: relative;
  transition: none !important;
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    height: 100vh; 
  }

  .sidebar {
    width: 100%;
    height: auto; 
    max-height: 40vh;
  }

  .map-wrapper {
    flex-grow: 1;
    min-height: 300px;
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue'
import SidePanel from './SidePanel.vue'
import InteractiveMap from './InteractiveMap.vue'
import type { Capture } from '@/scripts/data/captures'
import LightboxModal from './modals/LightboxModal.vue'

const filteredCaptures = ref<Capture[]>([])
const mapRef = ref<any>(null)
const selectedPhoto = ref<{ captureId: string; id: string } | null>(null)
const sidePanelRef = ref<InstanceType<typeof SidePanel> | null>(null)

function handleSelectCapture(item: Capture) {
  if (item.expanded && item.centroidCoordinates && mapRef.value) {
    mapRef.value.flyToCapture(item.centroidCoordinates)
  }
}

function handleToggleCapturePhotos(payload: { captureId: string; enabled: boolean; photos: any[] }) {
  if (mapRef.value) {
    mapRef.value.handlePhotoEntities(payload)
  }
}

function openLightbox(photo: { captureId: string; id: string }) {
  selectedPhoto.value = photo
}

function closeLightbox() {
  selectedPhoto.value = null
}

function handleOpenCaptureCard(captureId: string) {
	sidePanelRef.value?.openCaptureById(captureId)
}
</script>