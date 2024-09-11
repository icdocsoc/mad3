<script lang="ts" setup>
const userCredentials = reactive({
  username: '',
  password: ''
});

const handleSubmit = () => {
  // TODO validate and submit
};
</script>

<template>
  <Card>
    <CardTitle>
      <h1>Signup</h1>
    </CardTitle>

    <form @submit.prevent="handleSubmit" class="mx-auto mt-5">
      <div class="my-3">
        <label
          for="username"
          class="inline text-lg font-medium leading-6 text-gray-900">
          Username:
        </label>
        <div
          class="ms-10 inline-flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary sm:max-w-md">
          <input
            type="text"
            name="username"
            id="username"
            v-model="userCredentials.username"
            autocomplete="username"
            class="w-max flex-1 border-0 bg-transparent py-1.5 pl-2 text-lg text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
            placeholder="e.g. nj421" />
        </div>
      </div>
      <div class="my-3">
        <label
          for="username"
          class="inline text-lg font-medium leading-6 text-gray-900">
          Password:
        </label>
        <div
          class="ms-10 inline-flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary sm:max-w-md">
          <input
            type="password"
            name="password"
            id="password"
            v-model="userCredentials.password"
            autocomplete="password"
            class="w-max flex-1 border-0 bg-transparent py-1.5 pl-2 text-lg text-gray-900 focus:ring-0 sm:text-sm sm:leading-6" />
        </div>
      </div>
      <button
        type="submit"
        class="mx-auto rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Login
      </button>
    </form>
  </Card>
</template>
