import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  } = useAuthStore();

  const isAuthenticated = !!session && !!user;

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email || '';

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : (user?.email?.charAt(0) || 'U').toUpperCase();

  return {
    user,
    session,
    profile,
    loading,
    error,
    isAuthenticated,
    fullName,
    initials,
    signIn,
    signUp,
    signOut,
    clearError,
  };
}

export default useAuth;
