<!-- app/pages/admin.vue -->
<template>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="container has-text-centered">
        <p class="title is-uppercase">
          {{ $t('admin') }}
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

