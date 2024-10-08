<script setup lang="ts">
const props = defineProps<{ student: IStudent }>();

const strongInterests = computed(() => {
  if (!props.student.interests) {
    return null;
  }

  return new Map(
    [...Object.entries(props.student.interests)].filter(
      ([_key, value]) => value === 2
    )
  );
});
const mildInterests = computed(() => {
  if (!props.student.interests) {
    return null;
  }

  return new Map(
    [...Object.entries(props.student.interests)].filter(
      ([_key, value]) => value === 1
    )
  );
});
</script>

<template>
  <Card>
    <CardTitle>
      <h3>{{ props.student.name }}</h3>
    </CardTitle>
    <CardText class="text-center">{{ props.student.shortcode }}</CardText>
    <CardText v-if="props.student.aboutMe" class="mt-2">
      <strong>About Me:</strong>
      {{ props.student.aboutMe }}
    </CardText>
    <CardText v-if="props.student.socials?.length">
      <strong>Social Media:</strong>
      <a v-for="social in props.student.socials" :href="social" target="_blank">
        <br />
        {{ social }}
      </a>
    </CardText>
    <details v-if="strongInterests != null">
      <summary>Strong Interests:</summary>
      <ul class="list-inside list-disc">
        <li v-for="[interest, _2] in strongInterests" :key="interest">
          {{ interestLabels[interest] }}
        </li>
      </ul>
    </details>
    <details v-if="mildInterests != null">
      <summary>Mild Interests:</summary>
      <ul class="list-inside list-disc">
        <li v-for="[interest, _1] in mildInterests" :key="interest">
          {{ interestLabels[interest] }}
        </li>
      </ul>
    </details>
  </Card>
</template>
