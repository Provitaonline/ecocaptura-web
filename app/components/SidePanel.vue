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
                <!-- Line 1: Description in bold (falling back to ID if description is missing) -->
                <p class="has-text-weight-semibold mb-1">
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
            <p v-if="item.description" class="is-size-7 mb-2">
              <strong>Description:</strong> {{ item.description }}
            </p>
            <p v-if="item.qualityReason" class="is-size-7 mb-2 has-text-grey">
              <strong>Quality Note:</strong> {{ item.qualityReason }}
            </p>
            <p v-if="item.centroidCoordinates" class="is-size-7 mb-0">
              <strong>Coords:</strong> {{ item.centroidCoordinates }}
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

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { getCaptures } from '~/scripts/data/captures'
import type { Capture } from '@/scripts/data/captures'

export default defineComponent({
  name: 'SidePanel',
  setup() {
    const captureList = ref<Capture[]>([])
    const searchString = ref('')
    const loading = ref(false)

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

    const toggleCard = (item: Capture) => {
      item.expanded = !item.expanded
      if (item.expanded && item.centroidCoordinates) {
        const parts = item.centroidCoordinates.split(',').map(Number)
        const lat = parts[0]
        const lng = parts[1]

        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          console.log(`Centering map at: Lat ${lat}, Lng ${lng}`)
        }
      }
    }

    const formatDate = (dateString?: string): string => {
      if (!dateString) return 'Unknown date'
      return new Date(dateString).toLocaleString()
    }

    return {
      captureList,
      searchString,
      loading,
      filteredCaptures,
      toggleCard,
      formatDate
    }
  }
})
</script>

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
</style>