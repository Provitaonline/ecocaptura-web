<!-- app/pages/admin.vue -->
<template>
  <section class="hero is-primary is-fullheight-with-navbar">
    <div class="hero-body">
      <div class="container has-text-centered">
        <p class="title">
          {{ $t('admin') }}
        </p>
        <p class="subtitle">
          {{ $t('adminPlaceholder') }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>

