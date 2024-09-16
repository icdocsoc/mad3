<script setup lang="ts">
type Props = {
  question: {
    type: 'matrix';
    title: string;
    rows: Record<string, string>;
    columns: Record<string, number>;
    required?: boolean;
  };
};

const props = defineProps<Props>();
</script>

<template>
  <div class="overflow-x-scroll">
    <h3>{{ props.question.title }}</h3>
    <table class="w-full">
      <thead>
        <tr class="border">
          <th class="border-x"></th>
          <th
            v-for="(value, key) in props.question.columns"
            :key="key"
            class="border-x px-2">
            {{ key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(value, key) in props.question.rows"
          :key="key"
          class="border">
          <td class="px-2 py-1">
            {{ value }}
          </td>
          <td v-for="_ in props.question.columns" :key="key" class="border-x">
            <div class="grid h-full w-full place-items-center px-1 py-2">
              <input
                type="radio"
                :name="key"
                :value="value"
                :required="props.question.required" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
