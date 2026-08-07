<template>
  <div class="main-layout">
    <SidePanel class="sidebar" />

    <div class="map-wrapper">
      <InteractiveMap />
    </div>
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
definePageMeta({
  middleware: 'auth'
})
</script>