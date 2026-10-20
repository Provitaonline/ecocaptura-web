<template>
	<b-modal 
		v-model="isOpen" 
		has-modal-card 
		trap-focus 
		aria-role="dialog" 
		aria-modal
	>
    <div class="modal-card" style="min-width: 380px;">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('admin.editUser') }}</p>
        <button type="button" class="delete" :disabled="isSaving" @click="$emit('update:active', false)" />
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

        <p class="mb-4">
          <strong>{{ $t('admin.username') }}:</strong> {{ user?.username }}<br>
          <strong>{{ $t('admin.email') }}:</strong> {{ user?.email }}
        </p>

        <b-field>
          <b-checkbox v-model="localIsReviewer">
            {{ $t('admin.isReviewer') }}
          </b-checkbox>
        </b-field>

        <b-field>
          <b-tooltip
            :label="$t('admin.cannotChangeOwnAdmin')"
            :active="isSelf"
            position="is-right"
          >
            <b-checkbox v-model="localIsAdmin" :disabled="isSelf">
              {{ $t('admin.isAdmin') }}
            </b-checkbox>
          </b-tooltip>
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
        <button class="button" :disabled="isSaving" @click="$emit('update:active', false)">
          {{ $t('cancel') }}
        </button>
      </footer>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminUser } from '@/scripts/data/adminUsers'
import { updateUserRoles } from '@/scripts/data/adminUsers'
import { useAuthStore } from '@/scripts/stores/auth'

const props = defineProps<{
  user: AdminUser | null
}>()

const isOpen = defineModel<boolean>('active', { required: true })

const emit = defineEmits<{
  (e: 'update:active', value: boolean): void
  (e: 'saved', updatedUser: AdminUser): void
}>()

const auth = useAuthStore()

const localIsAdmin = ref(false)
const localIsReviewer = ref(false)
const isSaving = ref(false)
const saveError = ref('')

// Is this user the currently logged-in admin?
const isSelf = computed(() => auth.username === props.user?.username)

watch(() => props.user, (user) => {
  if (user) {
    localIsAdmin.value = user.isAdmin
    localIsReviewer.value = user.isReviewer
    saveError.value = ''
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (open && props.user) {
    localIsAdmin.value = props.user.isAdmin
    localIsReviewer.value = props.user.isReviewer
    saveError.value = ''
  }
})

const handleSave = async () => {
  if (!props.user) return
  saveError.value = ''
  isSaving.value = true
  try {
    const payload: { isReviewer: boolean; isAdmin?: boolean } = {
      isReviewer: localIsReviewer.value,
    }
    if (!isSelf.value) {
      payload.isAdmin = localIsAdmin.value
    }
    const updated = await updateUserRoles(props.user.username, payload)
    emit('saved', updated)
    emit('update:active', false)
  } catch (error: any) {
    saveError.value = error.message || 'Failed to update user roles.'
  } finally {
    isSaving.value = false
  }
}
</script>

