import { createContext, ReactNode, useContext } from 'react';

// Set once by admin-dashboard/_layout.tsx (which already resolved the role
// via useRoleGate) so any screen under /admin-dashboard can tell a ceo
// apart from a plain admin without re-running the auth check itself.
const AdminRoleContext = createContext<'admin' | 'ceo'>('admin');

export function AdminRoleProvider({ role, children }: { role: 'admin' | 'ceo'; children: ReactNode }) {
  return <AdminRoleContext.Provider value={role}>{children}</AdminRoleContext.Provider>;
}

export function useAdminRole() {
  return useContext(AdminRoleContext);
}
