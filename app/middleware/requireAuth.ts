export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const { currentUser } = useAuth();

  if (currentUser.value == null) {
    return createError({
      statusCode: 404,
      fatal: true
    });
  }
});
