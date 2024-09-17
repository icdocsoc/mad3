export default defineNuxtRouteMiddleware(async (to, from) => {
  const headers = useRequestHeaders(['cookie']);
  const { user } = useAuth()

  const req = await useFetch('/api/family/me', {
    credentials: 'same-origin',
    headers: headers
  })
  
  if (!req.error.value) user.value = req.data.value
});
