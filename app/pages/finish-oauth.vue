<script setup lang="ts">
const route = useRoute();

const {
  code: msCode,
  state: msState,
  error: msError,
  error_description: msErrorDesc
} = route.query;

const body = !msError
  ? {
      code: msCode,
      state: msState
    }
  : {
      error: msError,
      error_description: msErrorDesc
    };

const { status, error } = await useFetch('/api/auth/callback', {
  method: 'POST',
  body: body,
  server: false
});

watch(status, () => {
  if (status.value == 'success') navigateTo('/portal');
});
</script>

<template>
  <div>
    <Card v-if="status == 'pending' || status == 'idle'">
      <CardTitle>We're signing you in...</CardTitle>
    </Card>
    <Card v-else-if="status == 'error'">
      <CardText>{{ error }}</CardText>
    </Card>
    <Card v-else-if="status == 'success'">
      <CardTitle>You are being redirected</CardTitle>
      <CardText>
        Please click
        <NuxtLink to="/portal">this link</NuxtLink>
        if not automatically redirected.
      </CardText>
    </Card>
  </div>
</template>
