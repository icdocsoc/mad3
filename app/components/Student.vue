<script setup lang="ts">
const props = defineProps<{ student: IStudent }>();
</script>

<template>
  <Card>
    <CardTitle>
      <h3>{{ props.student.name }}</h3>
    </CardTitle>
    <CardText v-if="props.student.aboutMe" class="mt-2">
      <strong>About Me:</strong> {{ props.student.aboutMe }}
    </CardText>
    <CardText v-if="props.student.socials">
      <strong>Social Media:</strong>
      <a v-for="social in props.student.socials" :href="social" target="_blank">
        <br>{{ social }}
      </a>
    </CardText>
  </Card>
</template>
