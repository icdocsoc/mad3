<script setup lang="ts">
definePageMeta({
  middleware: [
    'require-auth',
    function () {
      const { currentUser } = useAuth();

      if (currentUser.value!.role !== 'parent') {
        navigateTo('/portal');
      }
    }
  ]
});
</script>

<template>
  <div>
    <Card>
      <CardTitle>Info:</CardTitle>

      <CardText class="mt-3">
        To complete your registration you must be in a family. You can do that
        by either proposing to someone or accepting a proposal.
        <ul class="mt-2 list-disc ps-4">
          <li>
            If you have any proposals they will appear on this page, and you can
            accept one to complete registration.
          </li>
          <li>
            You can also propose to your chosen partner using their shortcode.
            <strong>
              Make sure they accept your proposal or your registration will not
              be valid.
            </strong>
          </li>
        </ul>
      </CardText>
    </Card>
    <Card>
      <CardTitle>People who proposed to you:</CardTitle>

      <div class="mt-4 flex flex-wrap gap-2 self-start">
        <div class="flex gap-5 border px-2 py-1">
          <div class="flex flex-col items-start">
            <strong>Nishant</strong>
            <p class="text-sm">nj421</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="cursor-pointer bg-green-400 p-1 text-sm text-white">
              Accept
            </span>
            <span class="cursor-pointer bg-red-400 p-1 text-sm text-white">
              Reject
            </span>
          </div>
        </div>
        <div class="flex gap-5 border px-2 py-1">
          <div class="flex flex-col items-start">
            <strong>Nishant</strong>
            <p class="text-sm">nj421</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="cursor-pointer bg-green-400 p-1 text-sm text-white">
              Accept
            </span>
            <span class="cursor-pointer bg-red-400 p-1 text-sm text-white">
              Reject
            </span>
          </div>
        </div>
      </div>
    </Card>
    <Card>
      <CardTitle>People that you proposed to:</CardTitle>

      <div class="mt-4 flex flex-wrap gap-2 self-start">
        <div class="flex gap-5 border px-2 py-1">
          <div class="flex flex-col items-start">
            <strong>Nishant</strong>
            <p class="text-sm">nj421</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="cursor-pointer bg-yellow-400 p-1 text-sm text-white">
              Pending
            </span>
          </div>
        </div>
      </div>

      <CardDetails>
        <strong>
          Want to send a proposal to a potential partner? Enter their exact
          shortcode:
        </strong>
        <input type="text" placeholder="e.g. nj421" />
      </CardDetails>
    </Card>
  </div>
</template>
