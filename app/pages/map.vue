<template>
  <div class="main-layout">
    <SidePanel class="sidebar" />

    <div class="map-wrapper">
	<ClientOnly>
      <InteractiveMap />
	</ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: calc(100vh - 3.5rem);
  overflow: hidden;
}

.sidebar {
  width: 20rem;
  flex-shrink: 0;
  overflow-y: auto;
}

.map-wrapper {
  flex-grow: 1; /* Automatically takes remaining width */
  min-width: 0; /* Prevents overflow */
  min-height: 0; /* Prevents the "Stable Height Chain" break */
  position: relative;
  transition: none !important;
}
</style>