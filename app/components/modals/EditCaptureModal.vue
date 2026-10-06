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
        <p class="modal-card-title">Edit Capture Details</p>
        <button type="button" class="delete" @click="close" />
      </header>

      <section class="modal-card-body">
        <!-- Description -->
        <b-field label="Description">
          <b-input 
            type="textarea" 
            v-model="description" 
            placeholder="Enter description..." 
          />
        </b-field>

        <!-- Quality Score -->
        <b-field label="Quality Score">
          <b-numberinput 
            v-model="qualityScore" 
            :min="0" 
            :max="10" 
            controls-position="compact"
          />
        </b-field>

        <!-- Quality Reason -->
        <b-field label="Quality Reason">
          <b-input 
            type="text" 
            v-model="qualityReason" 
            placeholder="Reason for quality score..." 
          />
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
const isOpen = defineModel<boolean>('active', { required: true })
const description = defineModel<string>('description', { default: '' })
const qualityScore = defineModel<number | null>('qualityScore', { default: null })
const qualityReason = defineModel<string>('qualityReason', { default: '' })

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
