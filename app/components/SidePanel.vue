<template>
  <div class="panel is-primary capture-sidebar">
    <!-- Panel Header & Search -->
    <div class="panel-heading">
      Captures
    </div>
    <div class="panel-block">
      <p class="control has-icons-left">
        <input 
          class="input is-small" 
          type="text" 
          placeholder="Search by ID or description..." 
          v-model="searchString"
        >
        <span class="icon is-small is-left">
          <i class="mdi mdi-magnify"></i>
        </span>
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="has-text-centered p-4">
      <span class="icon is-medium fas fa-spinner fa-pulse"></span>
      <p class="is-size-7 has-text-grey">Loading captures...</p>
    </div>

    <!-- Capture List -->
    <div v-else class="capture-list-container">
      <template v-if="filteredCaptures.length > 0">
        <div 
          v-for="item in filteredCaptures" 
          :key="item.captureId" 
          class="card mb-3"
        >
          <!-- Card Header -->
          <div class="card-header" @click="toggleCard(item)" style="cursor: pointer;">
            <div class="card-header-title is-flex is-justify-content-space-between align-items-start">
              <div>
              <!-- Line 1: Description in bold with 2-line clamp and ellipsis -->
              <p class="has-text-weight-semibold mb-1 clamped-description">
                {{ item.description || `#${item.captureId.substring(0, 8)}` }}
              </p>
                
                <!-- Line 2: Date in yyyy-mm-dd hh:mm format -->
                <p class="is-size-7 has-text-grey font-weight-normal mb-1">
                  {{ formatDate(item.timestamp || item.createdAt) }}
                </p>
                
                <!-- Line 3: Quality score represented as 3 stars (filled/empty) -->
                <div v-if="item.qualityScore !== undefined" class="is-size-7 has-text-warning">
                  <span v-for="star in 3" :key="star">
                    <i :class="star <= item.qualityScore ? 'mdi mdi-star' : 'mdi mdi-star-outline'"></i>
                  </span>
                </div>
              </div>
            </div>
            <a class="card-header-icon" aria-label="more options">
              <span class="icon is-medium">
                <i :class="item.expanded ? 'mdi mdi-chevron-up mdi-24px' : 'mdi mdi-chevron-down mdi-24px'"></i>
              </span>
            </a>
          </div>

          <!-- Card Content / Expanded Section -->
          <div v-if="item.expanded" class="card-content">
            <!-- Add to Map Switch -->
            <div class="mb-3">
              <b-switch 
                v-model="showPhotosMap[item.captureId]" 
                size="is-small"
                @input="togglePhotosOnMap(item)"
              >
                Add to map
              </b-switch>
            </div>

            <p v-if="item.qualityReason" class="is-size-7 mb-2 has-text-grey">
              <strong>Quality Note:</strong> {{ item.qualityReason }}
            </p>

            <!-- Loading state -->
            <div v-if="loadingDetailsMap[item.captureId]" class="has-text-centered py-3">
              <span class="icon is-small is-loading"></span>
              <span class="is-size-7 ml-2">Loading photos...</span>
            </div>

            <!-- Thumbnails Grid using Bulma columns -->
            <div v-else-if="captureDetailsMap[item.captureId]?.photos?.length" class="columns is-multiline is-mobile is-variable is-1 mt-1">
              <div 
                v-for="photo in captureDetailsMap[item.captureId]?.photos" 
                :key="photo.photoId" 
                class="column is-one-third"
              >
                <figure class="image is-square">
                  <img 
                    :src="photo.thumbnailUrl || '/images/placeholder.png'" 
                    :alt="photo.description || 'Capture photo thumbnail'"
                    style="object-fit: cover; border-radius: 4px;"
                  />
                </figure>
              </div>
            </div>

            <p v-if="item.description" class="is-size-7 mb-2">
              {{ item.description }}
            </p>

            <p v-else-if="captureDetailsMap[item.captureId]" class="is-size-7 has-text-grey">
              No photos attached to this capture.
            </p>
          </div> 
        </div>
      </template>
      <div v-else class="panel-block has-text-grey is-size-7">
        No matching captures found.
      </div>
    </div>
  </div>
</template>

<style scoped>
.capture-sidebar {
  height: 100%;
  overflow-y: auto;
}
.capture-list-container {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}
.border-top {
  border-top: 1px solid #dbdbdb;
}
.clamped-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getCaptures } from '~/scripts/data/captures'
import { getCaptureDetails } from '~/scripts/data/captureDetails'
import type { CaptureDetailRecord } from '~/scripts/data/captureDetails'
import type { Capture } from '@/scripts/data/captures'

const emit = defineEmits<{
  (e: 'update:filtered-captures', list: Capture[]): void
  (e: 'select-capture', item: Capture): void
  (e: 'toggle-capture-photos', payload: { captureId: string; enabled: boolean; photos: any[] }): void
}>()

const captureList = ref<Capture[]>([])
const searchString = ref('')
const loading = ref(false)

// Store detailed capture records keyed by captureId
const captureDetailsMap = ref<Record<string, CaptureDetailRecord>>({})
const loadingDetailsMap = ref<Record<string, boolean>>({})

const showPhotosMap = ref<Record<string, boolean>>({})

const filteredCaptures = computed(() => {
  if (!captureList.value.length) return []
  
  const sorted = [...captureList.value].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt || 0).getTime()
    const timeB = new Date(b.timestamp || b.createdAt || 0).getTime()
    return timeB - timeA
  })

  if (!searchString.value || searchString.value.length < 2) {
    return sorted
  }

  const query = searchString.value.toLowerCase()
  return sorted.filter(item => {
    const idMatch = item.captureId.toLowerCase().includes(query)
    const descMatch = item.description?.toLowerCase().includes(query) || false
    return idMatch || descMatch
  })
})

// Watch filteredCaptures to keep the parent map in sync automatically
watch(filteredCaptures, (newList) => {
  emit('update:filtered-captures', newList)
}, { immediate: true })

onMounted(async () => {
  window.addEventListener('auth-expired', () => {
    console.warn("User session has ended. Redirecting or showing login modal.")
    window.location.href = '/'
  })

  loading.value = true
  try {
    captureList.value = await getCaptures()
  } catch (error) {
    console.error("Could not load capture list", error)
  } finally {
    loading.value = false
  }
})

const toggleCard = async (item: Capture) => {
  item.expanded = !item.expanded
  
  if (item.expanded) {
    // Map navigation trigger
    if (item.centroidCoordinates) {
      emit('select-capture', item)
      const parts = item.centroidCoordinates.split(',').map(Number)
      const lat = parts[0]
      const lng = parts[1]

      if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
        console.log(`Centering map at: Lat ${lat}, Lng ${lng}`)
      }
    }

    // Fetch detailed data (including photos) incrementally if not already cached
    if (!captureDetailsMap.value[item.captureId] && !loadingDetailsMap.value[item.captureId]) {
      try {
        loadingDetailsMap.value[item.captureId] = true
        const details = await getCaptureDetails(item.captureId)
        captureDetailsMap.value[item.captureId] = details
      } catch (error) {
        console.error(`Failed to load details for capture ${item.captureId}:`, error)
      } finally {
        loadingDetailsMap.value[item.captureId] = false
      }
    }
  }
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date'
  return new Date(dateString).toLocaleString()
}

const togglePhotosOnMap = (item: Capture) => {
  const isEnabled = !!showPhotosMap.value[item.captureId]
  const details = captureDetailsMap.value[item.captureId]
  
  emit('toggle-capture-photos', {
    captureId: item.captureId,
    enabled: isEnabled,
    photos: details?.photos || []
  })
}
</script>