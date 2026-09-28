<script setup lang="ts">
const { currentUser } = useAuth();
const { currentState } = useAppState();

definePageMeta({
  middleware: ['require-auth']
});

// A parent's partner, or anyone's family once allocated. A 404 means "not yet".
const { data: family } = useFetch<IFamily>('/api/family/myFamily', {
  headers: useRequestHeaders(['cookie'])
});

const me = computed(() => currentUser.value!);
const partner = computed(() =>
  family.value?.parents.find(parent => parent.shortcode != me.value.shortcode)
);
const hasChildren = computed(() => (family.value?.kids.length ?? 0) > 0);
</script>

<template>
  <Card>
    <CardTitle>
      Hi, {{ me.answers?.preferredName || me.name || me.shortcode }}
    </CardTitle>
    <CardText class="mt-2 text-center">
      {{ me.role == 'fresher' ? 'Fresher' : 'Parent' }} · Sign-ups are
      {{ currentState }}
    </CardText>

    <p
      v-if="me.role == 'parent'"
      class="mb-4 rounded border-l-4 border-primary bg-gray-50 p-3">
      Thank you for taking on the responsibility of nurturing some wonderful
      children! We need some info to help you all get along. We wish you and
      your partner a happy marriage and a nourishing future with your children!
    </p>

    <ol class="flex flex-col gap-3">
      <li class="flex items-start gap-3">
        <Brace
          :mark="me.completedSurvey ? 'ok' : '1'"
          :tone="me.completedSurvey ? 'done' : 'todo'" />
        <div>
          <strong>The survey</strong>
          <p v-if="me.completedSurvey">
            Done.
            <NuxtLink v-if="currentState == 'open'" to="/survey">
              Change your answers
            </NuxtLink>
          </p>
          <p v-else-if="currentState == 'open'">
            It takes about five minutes:
            <NuxtLink to="/survey">fill in the survey</NuxtLink>
          </p>
          <p v-else>Sign-ups are closed, so the survey isn't taking answers.</p>
        </div>
      </li>

      <li v-if="me.role == 'parent'" class="flex items-start gap-3">
        <Brace :mark="partner ? 'ok' : '2'" :tone="partner ? 'done' : 'todo'" />
        <div>
          <strong>Your partner</strong>
          <p v-if="partner">
            You're parents with
            {{ partner.answers?.preferredName || partner.name }}.
          </p>
          <p v-else-if="currentState == 'open'">
            Parents sign up in pairs, and you haven't paired up yet.
            <NuxtLink to="/proposals">Propose to your partner</NuxtLink>
          </p>
          <p v-else>You didn't pair up before sign-ups closed.</p>
        </div>
      </li>

      <li class="flex items-start gap-3">
        <Brace
          :mark="hasChildren ? 'ok' : '..'"
          :tone="hasChildren ? 'done' : 'todo'" />
        <div>
          <strong>Your family</strong>
          <p v-if="hasChildren">
            Your family is ready.
            <NuxtLink to="/family">Meet them</NuxtLink>
          </p>
          <p v-else>
            Families are allocated after sign-ups close. We'll email you when
            yours is ready.
          </p>
        </div>
      </li>
    </ol>
  </Card>
</template>
