<script setup lang="ts">
const { authState } = useAuth();

// Note: url will only work on host, not server. This is okay.
const url = useRequestURL();
const logInUrl = 'http://' + url.host + '/api/auth/signIn';
const logOutUrl = 'http://' + url.host + '/api/auth/signOut';
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
      <li v-if="authState == 'loggedOut'">
        <NavigationLink :to="logInUrl">
          <span class="font-bold md:text-xl">Log In</span>
        </NavigationLink>
      </li>
      <li v-else="authState == 'loggedIn'">
        <NavigationLink :to="logOutUrl">
          <span class="font-bold md:text-xl">Log Out</span>
        </NavigationLink>
      </li>
    </ul>
  </nav>
</template>
