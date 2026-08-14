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
import { getCachedPresignedUrl, cachePresignedUrl } from '@/scripts/utils/presignedCache'
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

  // Check cache first!
  const cachedUrl = getCachedPresignedUrl(newPhoto.id)
  if (cachedUrl) {
    activeLightboxImage.value = cachedUrl
    isImageLoading.value = false
    isActualImageLoading.value = true 
    return
  }

  // Otherwise, fetch normally
  isImageLoading.value = true
  isActualImageLoading.value = true

  try {
    const presignedUrls = await getDownloadPresignedUrls(newPhoto.captureId, [
      { id: newPhoto.id, type: 'PHOTO' }
    ])
    const signedItem = presignedUrls.find(item => item.id === newPhoto.id)
    if (signedItem?.downloadUrl) {
      activeLightboxImage.value = signedItem.downloadUrl
      // Cache it for subsequent opens
      cachePresignedUrl(newPhoto.id, signedItem.downloadUrl)
    }
  } catch (error) {
    console.error('Error loading full image:', error)
    isActualImageLoading.value = false
  } finally {
    isImageLoading.value = false
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