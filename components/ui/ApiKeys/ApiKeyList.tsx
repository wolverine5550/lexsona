'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { ApiKey } from '@/types/settings';
import { Badge } from '@/components/ui/Badge';
import { CopyButton } from '@/components/ui/CopyButton';

interface ApiKeyListProps {
  keys: ApiKey[];
  onRevoke: (keyId: string) => Promise<void>;
}

/**
 * Displays a list of API keys with their status, scopes, and actions
 * Includes copy functionality and revocation controls
 */
export function ApiKeyList({ keys, onRevoke }: ApiKeyListProps) {
  const [revokingKey, setRevokingKey] = useState<string | null>(null);

  // Status badge colors
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-yellow-100 text-yellow-800',
    revoked: 'bg-red-100 text-red-800'
  };

  // Handle key revocation
  const handleRevoke = async (keyId: string) => {
    setRevokingKey(keyId);
    try {
      await onRevoke(keyId);
    } finally {
      setRevokingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {keys.map((key) => (
        <div
          key={key.id}
          className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          {/* Key Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{key.name}</h3>
              <p className="text-sm text-gray-500">{key.description}</p>
            </div>
            <Badge className={statusColors[key.status]}>{key.status}</Badge>
          </div>

          {/* Key Details */}
          <div className="mt-4 space-y-2">
            {/* Only show actual key for newly created keys */}
            {key.key && (
              <div className="flex items-center space-x-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                  {key.key}
                </code>
                <CopyButton
                  value={key.key}
                  label="Copy API key"
                  successMessage="API key copied!"
                />
              </div>
            )}

            {/* Scopes */}
            <div className="flex flex-wrap gap-2">
              {key.scopes.map((scope) => (
                <Badge
                  key={scope}
                  className="bg-blue-100 text-blue-800 text-xs"
                >
                  {scope}
                </Badge>
              ))}
            </div>

            {/* Metadata */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>
                Created{' '}
                {formatDistanceToNow(new Date(key.created_at), {
                  addSuffix: true
                })}
              </p>
              {key.expires_at && (
                <p>
                  Expires{' '}
                  {formatDistanceToNow(new Date(key.expires_at), {
                    addSuffix: true
                  })}
                </p>
              )}
              {key.last_used_at && (
                <p>
                  Last used{' '}
                  {formatDistanceToNow(new Date(key.last_used_at), {
                    addSuffix: true
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end">
            {key.status === 'active' && (
              <button
                type="button"
                onClick={() => handleRevoke(key.id)}
                disabled={revokingKey === key.id}
                className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                aria-busy={revokingKey === key.id}
              >
                {revokingKey === key.id ? 'Revoking...' : 'Revoke'}
              </button>
            )}
          </div>
        </div>
      ))}

      {keys.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No API keys found. Create one to get started.
        </p>
      )}
    </div>
  );
}
