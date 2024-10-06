export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) return;
  const { currentUser } = useAuth();
  const { admins } = useRuntimeConfig();


  if (!admins.includes(currentUser.value?.shortcode || '')) {
    return createError({
      statusCode: 404,
      fatal: true
    });
  }
});
