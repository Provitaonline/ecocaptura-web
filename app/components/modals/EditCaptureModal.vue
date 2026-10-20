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
        <button type="button" class="delete" :disabled="isSaving" @click="close" />
      </header>

      <section class="modal-card-body">
        <b-message 
          v-if="saveError" 
          type="is-danger" 
          :closable="false" 
          size="is-small" 
          class="mb-3"
        >
          {{ saveError }}
        </b-message>

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
                :class="star <= (hoverScore || (qualityScore ?? 3)) ? 'mdi mdi-star mdi-24px' : 'mdi mdi-star-outline mdi-24px'"
              ></i>
            </span>
          </div>
        </b-field>

        <!-- Quality Reason -->
        <b-field 
          v-if="(qualityScore ?? 3) < 3" 
          :label="$t('qualityReason')"
        >
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
        <button 
          class="button is-primary" 
          :class="{ 'is-loading': isSaving }" 
          :disabled="isSaving" 
          @click="handleSave"
        >
          {{ $t('saveChanges') }}
        </button>
        <button class="button" :disabled="isSaving" @click="close">
          {{ $t('cancel') }}
        </button>
      </footer>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import enLocale from '@@/i18n/locales/en.json'
import { updateCapture } from '@/scripts/data/captureDetails'

const { t } = useI18n()

const isOpen = defineModel<boolean>('active', { required: true })
const description = defineModel<string>('description', { default: '' })
const qualityScore = defineModel<number | null>('qualityScore', { default: 3 })
const qualityReason = defineModel<string>('qualityReason', { default: '' })

const isSaving = ref(false)
const saveError = ref('')

const ensureValidQuality = () => {
  const current = qualityScore.value
  if (!current || current < 1 || current > 3) {
    qualityScore.value = 3
  }
  const score = qualityScore.value ?? 3
  if (score < 3) {
    if (!qualityReason.value) {
      qualityReason.value = 'other'
    }
  } else {
    qualityReason.value = ''
  }
}

watch(isOpen, (open) => {
  if (open) {
    saveError.value = ''
    ensureValidQuality()
  }
}, { immediate: true })

watch(qualityScore, (newScore) => {
  if (!newScore || newScore < 1 || newScore > 3) {
    qualityScore.value = 3
    return
  }
  if (newScore < 3) {
    if (!qualityReason.value) {
      qualityReason.value = 'other'
    }
  } else {
    qualityReason.value = ''
  }
}, { immediate: true })

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
  qualityScore.value = star
  if (star < 3) {
    if (!qualityReason.value) {
      qualityReason.value = 'other'
    }
  } else {
    qualityReason.value = ''
  }
}

const props = defineProps<{
  captureId: string
  username?: string
}>()

const emit = defineEmits<{
  (e: 'save', payload: {
    captureId: string
    description: string
    qualityScore: number
    qualityReason: string
    updatedRecord?: any
  }): void
}>()

const close = () => {
  if (isSaving.value) return
  saveError.value = ''
  isOpen.value = false
}

const handleSave = async () => {
  saveError.value = ''
  isSaving.value = true
  try {
    const current = qualityScore.value
    const score = (current !== null && current >= 1 && current <= 3) ? current : 3
    const finalReason = score < 3 ? (qualityReason.value || 'other') : ''

    const updated = await updateCapture(props.captureId, {
      description: description.value,
      qualityScore: score,
      qualityReason: finalReason,
    }, props.username) // Pass username here

    emit('save', {
      captureId: props.captureId,
      description: description.value,
      qualityScore: score,
      qualityReason: finalReason,
      updatedRecord: updated,
    })
    isOpen.value = false
  } catch (error: any) {
    console.error('Failed to update capture:', error)
    saveError.value = error.message || 'Failed to update capture details.'
  } finally {
    isSaving.value = false
  }
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
