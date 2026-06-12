import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    // Show a minimal full-screen loader while auth state is being initialised
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: '#0a0a0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent border-t-violet-500"
            style={{ animation: 'spin 0.8s linear infinite' }}
          />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
