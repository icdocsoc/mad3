<script setup lang="ts">
const route = useRoute();

const {
  code: msCode,
  status: msStatus,
  error: msError,
  error_description: msErrorDesc
} = route.query;
const { status, error } = useFetch('/api/auth/callback', {
  method: 'POST',
  body: {
    code: msCode,
    status: msStatus,
    error: msError,
    error_description: msErrorDesc
  }
});
watch(status, () => {
  if (status.value == 'success') {
    navigateTo('/survey');
  }
});
</script>

<template>
  <div>
    <p v-if="status == 'pending'">We're signing you in...</p>
    <p v-else-if="status == 'error'">Error: {{ error }}</p>
    <div v-else>
      <p>You are being redirected</p>
      <p>
        Please click
        <NuxtLink to="/survey">this link</NuxtLink>
        if not automatically redirected.
      </p>
    </div>
  </div>
</template>
