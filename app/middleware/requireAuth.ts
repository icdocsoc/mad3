export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { currentUser } = useAuth();

  if (currentUser.value == null) {
    return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
  }
});
