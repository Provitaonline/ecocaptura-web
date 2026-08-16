<!-- app/pages/index.vue -->
<template>
  <div class="section">
    <div class="container">
      <h1 class="title">{{ homeContent?.title }}</h1>
      <p class="subtitle">
        {{ homeContent?.description }}
      </p>
      
      <div class="box">
        <ContentRenderer class="content" v-if="homeContent" :value="homeContent" />
        <NuxtLink to="/captures">{{$t('seeCaptures')}}</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()

const { data: homeContent } = await useAsyncData(
  () => {
    const collection = (`content_${locale.value}`) as keyof Collections
    return queryCollection(collection).path('/home').first()
  },
  { watch: [locale] }
)

</script>