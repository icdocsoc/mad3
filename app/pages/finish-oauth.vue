<script setup lang="ts">
const route = useRoute();

const {
  code: msCode,
  state: msState,
  error: msError,
  error_description: msErrorDesc
} = route.query;

let body;
if (msError == undefined) {
  body = {
    code: msCode,
    state: msState
  };
} else {
  body = {
    error: msError,
    error_description: msErrorDesc
  };
}

const { data, status, error } = await useFetch('/api/auth/callback', {
  method: 'POST',
  body: body,
  server: false
});

watch(data, () => {
  if (data == null) return;

  if (data.value.done_survey) navigateTo('/family');
  else navigateTo('/survey');
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
        <NuxtLink to="/survey">this link</NuxtLink>
        if not automatically redirected.
      </CardText>
    </Card>
  </div>
</template>
