<template>
	<b-modal 
		v-model="isOpen" 
		has-modal-card 
		trap-focus 
		aria-role="dialog" 
		aria-modal
	>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('editCaptureDetails') }}</p>
        <button type="button" class="delete" @click="close" />
      </header>

      <section class="modal-card-body">
        <!-- Description -->
        <b-field :label="$t('description')">
          <b-input 
            type="textarea" 
            v-model="description" 
            :placeholder="$t('enterDescription')" 
          />
        </b-field>

        <!-- Quality Score -->
        <b-field :label="$t('qualityScore')">
          <div class="star-rating is-flex is-align-items-center" @mouseleave="hoverScore = 0">
            <span
              v-for="star in 3"
              :key="star"
              role="button"
              :tabindex="0"
              :aria-label="`Set score to ${star} star${star > 1 ? 's' : ''}`"
              class="icon is-medium has-text-warning mr-1"
              @click="setQualityScore(star)"
              @keydown.enter.prevent="setQualityScore(star)"
              @keydown.space.prevent="setQualityScore(star)"
              @mouseenter="onMouseEnter(star)"
            >
              <i
                :class="star <= (hoverScore || qualityScore || 0) ? 'mdi mdi-star mdi-24px' : 'mdi mdi-star-outline mdi-24px'"
              ></i>
            </span>
          </div>
        </b-field>

        <!-- Quality Reason -->
        <b-field :label="$t('qualityReason')">
          <b-select
            v-model="qualityReason"
            expanded
            :placeholder="$t('selectQualityReason')"
          >
            <option
              v-for="option in qualityReasonOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </b-select>
        </b-field>
      </section>

      <footer class="modal-card-foot">
        <button class="button is-primary" @click="handleSave">Save Changes</button>
        <button class="button" @click="close">Cancel</button>
      </footer>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import enLocale from '@@/i18n/locales/en.json'

const { t } = useI18n()

const isOpen = defineModel<boolean>('active', { required: true })
const description = defineModel<string>('description', { default: '' })
const qualityScore = defineModel<number | null>('qualityScore', { default: null })
const qualityReason = defineModel<string>('qualityReason', { default: '' })

// Derive reason keys dynamically from en.json to avoid duplication
const qualityReasonKeys = Object.keys(enLocale.qualityReasons)

const qualityReasonOptions = computed(() => {
  const options = qualityReasonKeys.map(key => ({
    value: key,
    label: t(`qualityReasons.${key}`)
  }))

  // If the capture has an existing custom/legacy reason not in en.json, keep it as an option
  if (qualityReason.value && !qualityReasonKeys.includes(qualityReason.value)) {
    options.push({
      value: qualityReason.value,
      label: qualityReason.value
    })
  }
  return options
})

const hoverScore = ref(0)

const onMouseEnter = (star: number) => {
  if (typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
    hoverScore.value = star
  }
}

const setQualityScore = (star: number) => {
  hoverScore.value = 0
  if (qualityScore.value === star) {
    qualityScore.value = 0
  } else {
    qualityScore.value = star
  }
}

const props = defineProps<{
  captureId: string
}>()

const emit = defineEmits<{
  (e: 'save', payload: { captureId: string; description: string; qualityScore: number | null; qualityReason: string }): void
}>()

const close = () => {
  isOpen.value = false
}

const handleSave = () => {
  console.log('save')
  emit('save', {
    captureId: props.captureId,
    description: description.value,
    qualityScore: qualityScore.value,
    qualityReason: qualityReason.value,
  })
  isOpen.value = false
}

</script>

<style scoped>
.star-rating .icon {
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  width: 2.25rem;
  height: 2.25rem;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease-in-out;
}

@media (hover: hover) and (pointer: fine) {
  .star-rating .icon:hover {
    transform: scale(1.15);
  }
}
</style>
