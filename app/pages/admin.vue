<!-- app/pages/admin.vue -->
<template>
  <section class="hero is-primary">
    <div class="hero-body">
      <div class="container has-text-centered">
        <p class="title is-uppercase">
          {{ $t('admin.title') }}
        </p>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">

      <!-- Search -->
      <div class="field mb-4" style="max-width: 400px;">
        <div class="control has-icons-left">
          <input
            class="input"
            type="text"
            :placeholder="$t('admin.searchPlaceholder')"
            v-model="searchQuery"
          >
          <span class="icon is-small is-left">
            <i class="mdi mdi-magnify"></i>
          </span>
        </div>
      </div>

      <!-- Table -->
      <b-table
        :data="filteredUsers"
        :loading="loading"
        striped
        hoverable
        mobile-cards
        :default-sort="['username', 'asc']"
      >
        <b-table-column
          field="username"
          :label="$t('admin.username')"
          sortable
          v-slot="{ row }"
        >
          {{ row.username }}
        </b-table-column>

        <b-table-column
          field="email"
          :label="$t('admin.email')"
          sortable
          v-slot="{ row }"
        >
          {{ row.email }}
        </b-table-column>

        <b-table-column
          field="isAdmin"
          :label="$t('admin.isAdmin')"
          sortable
          centered
          v-slot="{ row }"
        >
          <span :class="row.isAdmin ? 'has-text-success' : 'has-text-grey-light'">
            <i :class="row.isAdmin ? 'mdi mdi-check-circle mdi-18px' : 'mdi mdi-minus-circle mdi-18px'"></i>
          </span>
        </b-table-column>

        <b-table-column
          field="isReviewer"
          :label="$t('admin.isReviewer')"
          sortable
          centered
          v-slot="{ row }"
        >
          <span :class="row.isReviewer ? 'has-text-success' : 'has-text-grey-light'">
            <i :class="row.isReviewer ? 'mdi mdi-check-circle mdi-18px' : 'mdi mdi-minus-circle mdi-18px'"></i>
          </span>
        </b-table-column>

        <b-table-column
          label=""
          centered
          width="48"
          v-slot="{ row }"
        >
          <button
            class="button p-0 has-text-grey"
            @click="openEditModal(row)"
            :aria-label="$t('editCapture')"
            :title="$t('admin.editUser')"
            style="height: auto; border: none; background: transparent;"
          >
            <span class="icon" aria-hidden="true">
              <i class="mdi mdi-square-edit-outline mdi-24px"></i>
            </span>
          </button>
        </b-table-column>

        <template #empty>
          <div class="has-text-centered has-text-grey py-4">
            {{ loading ? $t('admin.loadingUsers') : $t('admin.noUsers') }}
          </div>
        </template>
      </b-table>

      <!-- Error -->
      <b-message v-if="loadError" type="is-danger" :closable="false" class="mt-4">
        {{ loadError }}
      </b-message>
    </div>

    <!-- Edit Modal -->
    <EditUserModal
      v-model:active="isEditModalActive"
      :user="selectedUser"
      @saved="handleUserSaved"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getUsers } from '~/scripts/data/adminUsers'
import type { AdminUser } from '~/scripts/data/adminUsers'
import EditUserModal from '~/components/modals/EditUserModal.vue'

definePageMeta({
  middleware: ['auth']
})

const users = ref<AdminUser[]>([])
const loading = ref(false)
const loadError = ref('')
const searchQuery = ref('')

const isEditModalActive = ref(false)
const selectedUser = ref<AdminUser | null>(null)

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

const openEditModal = (user: AdminUser) => {
  selectedUser.value = user
  isEditModalActive.value = true
}

const handleUserSaved = (updatedUser: AdminUser) => {
  users.value = users.value.map(u =>
    u.username === updatedUser.username ? updatedUser : u
  )
}

onMounted(async () => {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (err: any) {
    loadError.value = err.message || 'Failed to load users.'
  } finally {
    loading.value = false
  }
})
</script>
