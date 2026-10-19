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

    <div ref="mapWrapperRef" class="map-wrapper">

      <div v-if="!isMapInteractive" class="map-touch-overlay">
        <div class="map-touch-banner" @click.stop="enableMapInteraction">
          <span>{{ $t('map.tapToInteract') }}</span>
        </div>
      </div>

      <InteractiveMap 
        ref="mapRef"
        :captures="filteredCaptures" 
        @open-lightbox="openLightbox"
        @open-capture="handleOpenCaptureCard"
        @search-location="(coords) => sidePanelRef?.handleMapSearch(coords)"
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

.map-touch-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background-color: rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.map-touch-banner {
  background-color: rgba(255, 255, 255, 0.80);
  color: #333;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (min-width: 769px) {
  .map-touch-overlay {
    display: none;
  }
}

@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    height: auto; 
    overflow: visible;
  }

  .sidebar {
    width: 100%;
    max-height: 80vh; 
    overflow-y: auto;
  }

  .map-wrapper {
    width: 100%;
    height: 50vh;
    min-height: 350px;
  }
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SidePanel from './SidePanel.vue'
import InteractiveMap from './InteractiveMap.vue'
import type { Capture } from '@/scripts/data/captures'
import LightboxModal from './modals/LightboxModal.vue'

const filteredCaptures = ref<Capture[]>([])
const mapRef = ref<any>(null)
const selectedPhoto = ref<{ captureId: string; id: string, username?: string } | null>(null)
const sidePanelRef = ref<InstanceType<typeof SidePanel> | null>(null)

// Touch Overlay State
const mapWrapperRef = ref<HTMLElement | null>(null)
const isMapInteractive = ref(false)

function enableMapInteraction() {
  isMapInteractive.value = true
}

function handleOutsideClick(e: MouseEvent) {
  if (isMapInteractive.value && mapWrapperRef.value && !mapWrapperRef.value.contains(e.target as Node)) {
    isMapInteractive.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

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

function openLightbox(photo: { captureId: string; id: string; username?: string }) {
  selectedPhoto.value = photo
}

function closeLightbox() {
  selectedPhoto.value = null
}

function handleOpenCaptureCard(captureId: string) {
  sidePanelRef.value?.openCaptureById(captureId)
}
</script>