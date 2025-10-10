import { useAuthStore } from '@/store/auth';

/**
 * Custom hook for checking user permissions
 * Provides a simple can() function to check if user has a specific permission
 * Admins automatically have all permissions
 */
export const usePermissions = () => {
  const { user } = useAuthStore();

  /**
   * Check if user has a specific permission
   * @param action - The action (e.g., 'manage', 'read', 'create', 'update', 'delete')
   * @param subject - The subject/resource (e.g., 'team', 'transactions', 'inventory')
   * @returns boolean - true if user has permission, false otherwise
   */
  const can = (action: string, subject: string): boolean => {
    if (!user || !user.permissions) return false;
    
    // Admins can do everything
    if (user.roles.includes('Admin')) return true;

    // Check if user has the specific permission
    const permissionString = `${action}_${subject}`;
    return user.permissions.includes(permissionString);
  };

  /**
   * Check if user has any of the specified roles
   * @param roles - Array of role names to check
   * @returns boolean - true if user has any of the roles
   */
  const hasRole = (roles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => roles.includes(role));
  };

  /**
   * Check if user is an Admin
   * @returns boolean - true if user is Admin
   */
  const isAdmin = (): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes('Admin');
  };

  /**
   * Get all user's permissions
   * @returns array of permission strings
   */
  const getPermissions = (): string[] => {
    return user?.permissions || [];
  };

  /**
   * Get all user's roles
   * @returns array of role names
   */
  const getRoles = (): string[] => {
    return user?.roles || [];
  };

  return { 
    can, 
    hasRole, 
    isAdmin, 
    getPermissions, 
    getRoles,
    user 
  };
};

