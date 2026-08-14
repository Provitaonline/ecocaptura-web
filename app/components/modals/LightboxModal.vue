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
      
      <img 
        v-show="activeLightboxImage && !isActualImageLoading" 
        :src="activeLightboxImage || ''" 
        alt="Blown out photo view" 
        @load="onImageLoaded"
      />
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

.lightbox-content img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
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
import { ref, watch } from 'vue'

const props = defineProps<{
  photo: { captureId: string; id: string } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeLightboxImage = ref<string | null>(null)
const isImageLoading = ref(false)
const isActualImageLoading = ref(false)

watch(() => props.photo, async (newPhoto) => {
  if (!newPhoto) {
    activeLightboxImage.value = null
    isImageLoading.value = false
    isActualImageLoading.value = false
    return
  }

  try {
    isImageLoading.value = true
    isActualImageLoading.value = true
    const presignedUrls = await getDownloadPresignedUrls(newPhoto.captureId, [
      { id: newPhoto.id, type: 'PHOTO' }
    ])
    const signedItem = presignedUrls.find(item => item.id === newPhoto.id)
    if (signedItem?.downloadUrl) {
      activeLightboxImage.value = signedItem.downloadUrl
    }
  } catch (error) {
    console.error('Error loading full image:', error)
    isActualImageLoading.value = false
  } finally {
    isImageLoading.value = false
  }
}, { immediate: true })

const onImageLoaded = () => {
  isActualImageLoading.value = false
}
</script>