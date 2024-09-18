export default defineNuxtRouteMiddleware(async (to, from) => {
  const headers = useRequestHeaders(['cookie']);
  const { setUser } = useAuth();

  const req = await useFetch('/api/family/me', {
    credentials: 'same-origin',
    headers: headers
  });

  setUser(!req.error.value ? req.data.value : null);
});
