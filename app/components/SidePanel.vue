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
          class="panel-block is-block capture-card"
        >
          <!-- Card Header / Summary Row -->
          <div @click="toggleCard(item)" class="is-flex justify-space-between align-center" style="cursor: pointer;">
            <div>
              <span class="has-text-weight-semibold">#{{ item.captureId.substring(0, 8) }}</span>
              <p class="is-size-7 has-text-grey">{{ formatDate(item.timestamp || item.createdAt) }}</p>
            </div>
            <div>
              <span v-if="item.qualityScore !== undefined" class="tag is-small is-info mr-2">
                ★ {{ item.qualityScore }}
              </span>
              <span class="icon">
                <i :class="item.expanded ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"></i>
              </span>
            </div>
          </div>

          <!-- Expanded Content -->
          <div v-if="item.expanded" class="mt-3 pt-3 border-top">
            <p v-if="item.description" class="is-size-7 mb-2">
              <strong>Description:</strong> {{ item.description }}
            </p>
            <p v-if="item.qualityReason" class="is-size-7 mb-2 has-text-grey">
              <strong>Quality Note:</strong> {{ item.qualityReason }}
            </p>
            <p v-if="item.centroidCoordinates" class="is-size-7 mb-2">
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