export default () => {
  const authState = useState('auth', () => 'loading');

  const checkAuthStatus = async () => {
    try {
      authState.value = 'loading'
      await $fetch('/api/family/me', {
        credentials: 'same-origin',
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
