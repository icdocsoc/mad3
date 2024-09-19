export default () => {
  // undefined means we haven't checked yet
  // null means we are sure that the user is not logged in
  const currentUser = useState<IStudent | null | undefined>(
    'user',
    () => undefined
  );
  const setUser = (newUser: IStudent | null) => {
    currentUser.value = newUser;
  };

  return {
    currentUser,
    setUser
  };
};
