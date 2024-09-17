export default () => {
  const authState = useState('auth', () => 'loading');
  const headers = useRequestHeaders(['cookie'])

  const checkAuthStatus = async () => {
    try {
      authState.value = 'loading'
      await useFetch('/api/family/me', {
        credentials: 'same-origin',
        headers: headers
      })
      
      // If we reach this point, the fetch was successful
      authState.value = 'loggedIn'
    } catch (error) {
      authState.value = 'loggedOut'
    }
  }
  return {
    authState,
    checkAuthStatus
  };
};
