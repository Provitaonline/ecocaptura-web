<template>
  <div v-if="photo" class="lightbox-overlay" @click="emit('close')">
    <div class="lightbox-content" @click.stop>
      <button 
        v-show="!isImageLoading && !isActualImageLoading" 
        class="lightbox-close" 
        @click="emit('close')"
      >
        &times;
      </button>
      
      <div v-if="isImageLoading || isActualImageLoading" class="lightbox-loader">
        <div class="button is-loading is-large is-white is-outlined is-borderless"></div>
      </div>
      
      <div class="lightbox-image-container">
        <img 
          ref="imageRef"
          v-show="activeLightboxImage && !isActualImageLoading" 
          :src="activeLightboxImage || ''" 
          alt="Blown out photo view" 
          @load="onImageLoaded"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-image-container {
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-content img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  cursor: grab;
}

.lightbox-content img:active {
  cursor: grabbing;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1000;
}

.lightbox-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px;
  min-width: 150px;
}

.is-borderless {
  border: none !important;
  background: transparent !important;
}
</style>

<script setup lang="ts">
import { getDownloadPresignedUrls } from '@/scripts/data/getDownloadPresignedUrls'
import panzoom, { type PanZoom } from 'panzoom'
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  photo: { captureId: string; id: string } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeLightboxImage = ref<string | null>(null)
const isImageLoading = ref(false)
const isActualImageLoading = ref(false)
const imageRef = ref<HTMLImageElement | null>(null)

let panzoomInstance: PanZoom | null = null

const destroyPanzoom = () => {
  if (panzoomInstance) {
    panzoomInstance.dispose()
    panzoomInstance = null
  }
}

watch(() => props.photo, async (newPhoto) => {
  if (!newPhoto) {
    destroyPanzoom()
    activeLightboxImage.value = null
    isImageLoading.value = false
    isActualImageLoading.value = false
    return
  }

  destroyPanzoom()
  isImageLoading.value = true
  isActualImageLoading.value = true

  let success = false
  let attempts = 0

  // Retry loop to accommodate background token refresh delays
  while (!success && attempts < 2) {
    attempts++
    try {
      const presignedUrls = await getDownloadPresignedUrls(newPhoto.captureId, [
        { id: newPhoto.id, type: 'PHOTO' }
      ])
      const signedItem = presignedUrls.find(item => item.id === newPhoto.id)
      if (signedItem?.downloadUrl) {
        activeLightboxImage.value = signedItem.downloadUrl
        success = true
      }
    } catch (error) {
      console.warn(`Attempt ${attempts} failed to fetch presigned URL, retrying...`, error)
      // Small pause to let any active token refresh finish committing to storage
      if (attempts < 2) {
        await new Promise(resolve => setTimeout(resolve, 800))
      }
    }
  }

  isImageLoading.value = false
  if (!success) {
    isActualImageLoading.value = false
    console.error('Failed to load full image after refresh attempts.')
  }
}, { immediate: true })

const onImageLoaded = async () => {
  isActualImageLoading.value = false
  await nextTick()
  if (imageRef.value && !panzoomInstance) {
    panzoomInstance = panzoom(imageRef.value, {
      maxZoom: 5,
      minZoom: 1,
      bounds: true,
      boundsPadding: 0.1,
      zoomDoubleClickSpeed: 1,
    })
  }
}

onUnmounted(() => {
  destroyPanzoom()
})
</script>