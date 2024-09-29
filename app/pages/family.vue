<script setup lang="ts">
const headers = useRequestHeaders();
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
    <div v-else-if="status == 'error'">Oops... {{ error?.message }}</div>
    <div v-else-if="status == 'success'">
      <CardDetails>
        <strong>Parents:</strong>
        <Student :student="data.parents[0]" />
        <Student :student="data.parents[1]" />
      </CardDetails>

      <CardDetails>
        <strong>Children:</strong>

        <div v-if="!data.kids.length">
          You currently have 0 kids assigned. Return to this page soon to see
          more information about your kids.
        </div>
        <div v-else>
          <Student
            v-for="kid in data.kids"
            :key="kid.shortcode"
            :student="kid" />
        </div>
      </CardDetails>
    </div>
  </Card>
</template>
