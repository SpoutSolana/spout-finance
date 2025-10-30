interface User {
  id: string;
  username: string | null;
  email: string | null;
}

export async function getUser(): Promise<User> {
  // TODO: Implement actual user authentication
  // For now return a generic user object
  return {
    id: "default",
    username: null,
    email: null,
  };
}
