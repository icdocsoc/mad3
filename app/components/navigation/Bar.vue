<script setup lang="ts">
// TODO: login must come from backend
const isLoggedIn = ref(false);
</script>

<template>
  <nav
    class="flex justify-between rounded-b-2xl bg-primary px-4 py-2 lg:mx-auto lg:max-w-screen-lg">
    <NavigationLink to="/" icon="/images/docsoc-square-white.png">
      <span class="md:hidden">MaD</span>
      <span class="max-md:hidden md:text-xl">Mums & Dads</span>
    </NavigationLink>
    <ul class="flex items-center gap-3">
      <li>
        <NavigationLink to="/parent">
          <span class="md:text-xl">Parent</span>
        </NavigationLink>
      </li>
      <li>
        <NavigationLink to="/fresher">
          <span class="md:text-xl">Fresher</span>
        </NavigationLink>
      </li>
    </ul>
  </nav>
</template>
