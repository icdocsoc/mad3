<script setup lang="ts">
const headers = useRequestHeaders(['cookie']);
const { currentUser } = useAuth();
const { data, status, error } = useFetch<IFamily>('/api/family/myFamily', {
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
    <CardText v-else-if="error?.statusCode == 404" class="mt-4">
      {{
        currentUser!.role == 'fresher'
          ? "You don't have a family yet. We'll email you as soon as it's allocated!"
          : "You don't have a partner yet, so there's no family to show."
      }}
      <NuxtLink v-if="currentUser!.role == 'parent'" to="/proposals">
        Find your partner
      </NuxtLink>
    </CardText>
    <CardText v-else-if="status == 'error'" class="mt-4">
      We couldn't load your family. Please refresh to try again.
    </CardText>
    <div v-else-if="data">
      <Family :family="data"></Family>
    </div>
  </Card>
</template>
