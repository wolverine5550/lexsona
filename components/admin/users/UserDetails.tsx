'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';
import type { User } from './UserManagement';

interface UserDetailsProps {
  user: User;
  onUpdate: (userId: string, updates: Partial<User>) => Promise<boolean>;
}

type ButtonVariant = 'flat' | 'slim';

export function UserDetails({ user, onUpdate }: UserDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingValue, setUpdatingValue] = useState<string | null>(null);

  // Handle role change
  const handleRoleChange = async (newRole: User['role']) => {
    setIsUpdating(true);
    setUpdatingValue(newRole);
    try {
      await onUpdate(user.id, { role: newRole });
    } finally {
      setIsUpdating(false);
      setUpdatingValue(null);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: User['status']) => {
    setIsUpdating(true);
    setUpdatingValue(newStatus);
    try {
      await onUpdate(user.id, { status: newStatus });
    } finally {
      setIsUpdating(false);
      setUpdatingValue(null);
    }
  };

  // Helper function to determine button variant
  const getButtonVariant = (isSelected: boolean): ButtonVariant => {
    return isSelected ? 'flat' : 'slim';
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      {/* User header */}
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center">
          <span className="text-lg font-medium text-white">
            {user.email[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-medium text-white">{user.email}</h2>
          <p className="text-sm text-zinc-400">
            Joined{' '}
            {formatDistanceToNow(new Date(user.created_at), {
              addSuffix: true
            })}
          </p>
        </div>
      </div>

      {/* Role management */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-400">Role</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['admin', 'staff', 'user'] as const).map((role) => (
            <Button
              key={role}
              variant={getButtonVariant(user.role === role)}
              className="text-sm"
              onClick={() => handleRoleChange(role)}
              disabled={isUpdating}
            >
              {isUpdating && updatingValue === role ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  data-testid="loading-spinner"
                />
              ) : null}
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Status management */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-400">Status</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['active', 'inactive'] as const).map((status) => (
            <Button
              key={status}
              variant={getButtonVariant(user.status === status)}
              className="text-sm"
              onClick={() => handleStatusChange(status)}
              disabled={isUpdating}
            >
              {isUpdating && updatingValue === status ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  data-testid="loading-spinner"
                />
              ) : null}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Last sign in */}
      {user.last_sign_in && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-400">Last Sign In</h3>
          <p className="mt-1 text-sm text-white">
            {formatDistanceToNow(new Date(user.last_sign_in), {
              addSuffix: true
            })}
          </p>
        </div>
      )}
    </div>
  );
}
