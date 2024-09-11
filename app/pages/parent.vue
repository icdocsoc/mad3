<script setup lang="ts">
const parent1: IStudent = {
  firstName: 'John',
  lastName: 'Doe',
  preferredName: 'JD',
  selfDescription: 'I am a parent',
  socialMedia: 'https://twitter.com/johndoe',
  shortcode: 'jd123'
};
const parent2: IStudent = {
  firstName: 'Jane',
  lastName: 'Doe',
  preferredName: 'Jane',
  selfDescription: 'I am a parent',
  socialMedia: 'https://twitter.com/janedoe',
  shortcode: 'jd223'
};

const kids: IStudent[] = [];
</script>

<template>
  <ParentFamily :parent1="parent1" :parent2="parent2" :kids="kids" />
</template>
