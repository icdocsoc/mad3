<script setup lang="ts">
import { labelOf } from '~~/hono/survey/survey';

const props = defineProps<{ student: IStudent }>();

const answers = computed(() => props.student.answers ?? {});
const text = (key: string) => answers.value[key] as string | undefined;

const displayName = computed(() => text('preferredName') || props.student.name);
const interests = computed(() =>
  ((answers.value.interests as string[] | undefined) ?? []).map(value =>
    labelOf('interests', value)
  )
);
</script>

<template>
  <Card>
    <CardTitle>
      <h3>{{ displayName }}</h3>
    </CardTitle>
    <CardText class="text-center">
      {{ props.student.shortcode }}
      <span v-if="text('course')">
        · {{ labelOf('course', text('course')!) }}
      </span>
    </CardText>
    <CardText v-if="text('bio') || props.student.aboutMe" class="mt-2">
      <strong>About me:</strong>
      {{ text('bio') || props.student.aboutMe }}
    </CardText>
    <CardText
      v-if="
        text('instagram') ||
        text('discord') ||
        text('phone') ||
        props.student.socials?.length
      ">
      <strong>Get in touch:</strong>
      <ul class="list-inside list-disc">
        <li v-if="text('instagram')">
          Instagram
          <a
            :href="`https://instagram.com/${text('instagram')}`"
            target="_blank">
            @{{ text('instagram') }}
          </a>
        </li>
        <li v-if="text('discord')">Discord: {{ text('discord') }}</li>
        <li v-if="text('phone')">
          Phone:
          <a :href="`tel:${text('phone')}`">{{ text('phone') }}</a>
        </li>
        <li v-for="social in props.student.socials ?? []" :key="social">
          <a :href="social" target="_blank">{{ social }}</a>
        </li>
      </ul>
    </CardText>
    <details v-if="interests.length">
      <summary>Into</summary>
      <ul class="list-inside list-disc">
        <li v-for="interest in interests" :key="interest">{{ interest }}</li>
      </ul>
    </details>
  </Card>
</template>
