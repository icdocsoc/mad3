export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const { currentUser } = useAuth();

  if (currentUser.value == null) return abortNavigation();
});
