<script setup lang="ts">
const headers = useRequestHeaders();
const { currentUser } = useAuth();
// TODO specify the type of data
const { data, status, error } = useFetch<any>('/api/family/myFamily', {
  headers
});

definePageMeta({
  middleware: ['require-auth']
});
</script>

<template>
  <Card>
    <CardTitle>Your Family</CardTitle>

    <div v-if="status == 'pending'">Loading...</div>
    <div v-else-if="error?.statusCode == 400">
      You do not have a family.
      {{
        currentUser!.role == 'fresher'
          ? "We'll let you know when your family has been allocated!"
          : 'All you needed was a happy marriage :('
      }}
    </div>
    <div v-else-if="status == 'error'">Oops... {{ error?.message }}</div>
    <div v-else-if="status == 'success'">
      <Family :family="data"></Family>
    </div>
  </Card>
</template>
