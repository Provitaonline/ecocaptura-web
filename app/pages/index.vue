<!-- app/pages/index.vue -->
<template>
  <div class="section">
    <div class="container">
      <h1 class="title">Welcome to Ecocaptura</h1>
      <p class="subtitle">
        Your spatial mapping and environmental data platform.
      </p>
      
      <div class="box">
        <h2 class="subtitle">Getting Started</h2>
        <p>This is your landing page. You can navigate to your map view once we integrate the globe.</p>
        
        <br />
        <NuxtLink to="/map">Go to Map</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BButton } from 'buefy'

const goToMap = () => {
  // We will create the map page next
  console.log('Navigating to map...')
}
</script>