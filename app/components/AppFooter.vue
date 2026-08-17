<template>
    <section>
      <footer class="footer">
        <div class="has-text-centered">
			{{ $t('developedBy') }} <a href="https://www.provita.org.ve/">Provita</a> (v{{ config.public.appVersion }})
        </div>
      </footer>
    </section>
</template>

<style scoped>
.footer {
	padding: .75rem 1.5rem .75rem;
}
</style>

<script setup>
const config = useRuntimeConfig()
</script>