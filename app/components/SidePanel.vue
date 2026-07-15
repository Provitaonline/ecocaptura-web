<template>
  <aside class="side-panel">
    <div class="side-panel-content">
      <nav class="panel">
        <p class="panel-heading has-text-centered is-size-5">
          Recent Captures
        </p>
        <a class="panel-block is-active">
          <span class="panel-icon"><i class="mdi mdi-map-marker"></i></span>
          Capture #001 - Portland
        </a>
        <a class="panel-block">
          <span class="panel-icon"><i class="mdi mdi-map-marker"></i></span>
          Capture #002 - Forest Park
        </a>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.side-panel {
  width: 20rem;
  transition: margin-left .3s;
}

.side-panel-content {
  overflow-y: auto;
  position: sticky;
  /*top: 1rem; */ /* Adjust based on your navbar height */
  max-height: 80vh;
}

@media only screen and (max-width: 768px) {
  .side-panel {
    width: 100%;
    border-right: 0;
  }
}
</style>