import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles, permission }) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafaf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
          <p className="text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roleSlug = user.role_slug || user.role?.slug;

  // First: check granular permission if specified (primary gate)
  if (permission) {
    const [mod, action = 'read'] = permission.split(':');
    if (hasPermission(mod, action)) return children;
    if (hasPermission(mod, 'manage')) return children;
    if (roles && roles.includes(roleSlug)) return children;
    return <Navigate to="/dashboard" replace />;
  }

  // Second: allow if role slug matches (fallback when no permission is specified)
  if (roles && roles.includes(roleSlug)) return children;

  // Block if roles were specified but didn't match
  if (roles) return <Navigate to="/dashboard" replace />;

  return children;
}
