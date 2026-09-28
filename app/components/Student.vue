<script setup lang="ts">
import { interestLabels } from '~~/hono/survey';

const props = defineProps<{ student: IStudent }>();

const interestsAt = (score: 1 | 2) =>
  Object.entries(props.student.interests ?? {})
    .filter(([_key, value]) => value === score)
    .map(([key]) => interestLabels[key as keyof typeof interestLabels] ?? key);

const loves = computed(() => interestsAt(2));
const likes = computed(() => interestsAt(1));
const displayName = computed(
  () => props.student.preferredName || props.student.name
);
</script>

<template>
  <Card>
    <CardTitle>
      <h3>{{ displayName }}</h3>
    </CardTitle>
    <CardText class="text-center">
      {{ props.student.shortcode }}
      <span v-if="props.student.completedSurvey">
        · {{ props.student.jmc ? 'JMC' : 'Computing' }}
      </span>
    </CardText>
    <CardText v-if="props.student.aboutMe" class="mt-2">
      <strong>About me:</strong>
      {{ props.student.aboutMe }}
    </CardText>
    <CardText
      v-if="
        props.student.instagram ||
        props.student.discord ||
        props.student.phone ||
        props.student.socials?.length
      ">
      <strong>Get in touch:</strong>
      <ul class="list-inside list-disc">
        <li v-if="props.student.instagram">
          Instagram
          <a
            :href="`https://instagram.com/${props.student.instagram}`"
            target="_blank">
            @{{ props.student.instagram }}
          </a>
        </li>
        <li v-if="props.student.discord">
          Discord: {{ props.student.discord }}
        </li>
        <li v-if="props.student.phone">
          Phone:
          <a :href="`tel:${props.student.phone}`">{{ props.student.phone }}</a>
        </li>
        <li v-for="social in props.student.socials ?? []" :key="social">
          <a :href="social" target="_blank">{{ social }}</a>
        </li>
      </ul>
    </CardText>
    <details v-if="loves.length">
      <summary>Loves</summary>
      <ul class="list-inside list-disc">
        <li v-for="interest in loves" :key="interest">{{ interest }}</li>
      </ul>
    </details>
    <details v-if="likes.length">
      <summary>Into</summary>
      <ul class="list-inside list-disc">
        <li v-for="interest in likes" :key="interest">{{ interest }}</li>
      </ul>
    </details>
  </Card>
</template>
