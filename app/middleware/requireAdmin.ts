export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.client) return;
  const { currentUser } = useAuth();
  // I am aware that the client might be able to Do Things, but that's okay
  // as if they have access to the admin page, everything is closed server-side anyways.
  const admins = process.env.WEBMASTERS!.split(',')


  if (!admins.includes(currentUser.value?.shortcode || '')) {
    return createError({
      statusCode: 404,
      fatal: true
    });
  }
});
