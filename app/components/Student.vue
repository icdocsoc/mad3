<script setup lang="ts">
const props = defineProps<{ student: IStudent }>();

const getName = (student: IStudent) => {
  const firstName = student.preferredName ?? student.firstName;
  return `${firstName} ${student.lastName}`;
};
</script>

<template>
  <Card>
    <CardTitle>
      <h3>{{ getName(props.student) }}</h3>
    </CardTitle>
    <CardText v-if="props.student.selfDescription" class="mt-2">
      About Me: {{ props.student.selfDescription }}
    </CardText>
    <CardText v-if="props.student.socialMedia">
      Social Media:
      <a :href="props.student.socialMedia" target="_blank">
        {{ props.student.socialMedia }}
      </a>
    </CardText>
  </Card>
</template>
