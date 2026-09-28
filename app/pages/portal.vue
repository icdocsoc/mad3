<script setup lang="ts">
const { currentUser } = useAuth();
const { currentState } = useAppState();

definePageMeta({
  middleware: ['require-auth']
});
</script>

<template>
  <Card>
    <CardTitle>Welcome to the portal, {{ currentUser!.shortcode }}</CardTitle>
    <CardDetails v-if="currentState == 'open'">
      <strong>
        {{
          currentUser!.role == 'fresher'
            ? 'Mums and Dads survey [OPEN]'
            : "Parent's survey & proposals [OPEN]"
        }}
      </strong>
      <CardText v-if="!currentUser!.completedSurvey">
        Please complete the
        <NuxtLink to="/survey">Mums and Dads survey</NuxtLink>
        {{
          currentUser!.role == 'fresher'
            ? 'so we can find you a family.'
            : 'before you propose to your partner.'
        }}
      </CardText>
      <CardText v-else-if="currentUser!.role == 'fresher'">
        Thank you for completing the survey! Look out for an email once families
        have been assigned.
      </CardText>
      <CardText v-else>
        Thank you for completing the survey! If you haven't yet, send or accept
        a
        <NuxtLink to="/proposals">proposal</NuxtLink>
        : you need a partner to become parents.
      </CardText>
    </CardDetails>
    <CardDetails v-else>
      <strong>Sign-ups are closed</strong>
      <CardText>
        Visit your
        <NuxtLink to="/family">family page</NuxtLink>
        to see your family.
      </CardText>
    </CardDetails>
  </Card>
</template>
