'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/Dialog';
import { Loader2, Trash2, Ban, CheckCircle } from 'lucide-react';
import type { User } from './UserManagement';

interface BulkActionsProps {
  selectedUsers: User[];
  onStatusChange: (
    userIds: string[],
    status: 'active' | 'inactive'
  ) => Promise<void>;
  onDelete: (userIds: string[]) => Promise<void>;
}

type BulkAction = 'delete' | 'activate' | 'deactivate';

export function BulkActions({
  selectedUsers,
  onStatusChange,
  onDelete
}: BulkActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async () => {
    if (!currentAction || isProcessing) return;

    setIsProcessing(true);
    try {
      const userIds = selectedUsers.map((user) => user.id);

      switch (currentAction) {
        case 'delete':
          await onDelete(userIds);
          break;
        case 'activate':
          await onStatusChange(userIds, 'active');
          break;
        case 'deactivate':
          await onStatusChange(userIds, 'inactive');
          break;
      }
    } finally {
      setIsProcessing(false);
      setIsConfirmOpen(false);
      setCurrentAction(null);
    }
  };

  const getActionDetails = () => {
    switch (currentAction) {
      case 'delete':
        return {
          title: 'Delete Users',
          description: `Are you sure you want to delete ${selectedUsers.length} selected user${
            selectedUsers.length === 1 ? '' : 's'
          }? This action cannot be undone.`,
          buttonText: 'Delete',
          buttonVariant: 'slim' as const,
          icon: Trash2
        };
      case 'activate':
        return {
          title: 'Activate Users',
          description: `Are you sure you want to activate ${selectedUsers.length} selected user${
            selectedUsers.length === 1 ? '' : 's'
          }?`,
          buttonText: 'Activate',
          buttonVariant: 'flat' as const,
          icon: CheckCircle
        };
      case 'deactivate':
        return {
          title: 'Deactivate Users',
          description: `Are you sure you want to deactivate ${selectedUsers.length} selected user${
            selectedUsers.length === 1 ? '' : 's'
          }?`,
          buttonText: 'Deactivate',
          buttonVariant: 'slim' as const,
          icon: Ban
        };
      default:
        return null;
    }
  };

  const actionDetails = getActionDetails();

  return (
    <>
      <div className="flex items-center space-x-2">
        <Button
          variant="slim"
          onClick={() => {
            setCurrentAction('delete');
            setIsConfirmOpen(true);
          }}
          disabled={selectedUsers.length === 0}
          className="text-red-500 hover:text-red-600"
          aria-label="Delete selected users"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <Button
          variant="flat"
          onClick={() => {
            setCurrentAction('activate');
            setIsConfirmOpen(true);
          }}
          disabled={selectedUsers.length === 0}
          aria-label="Activate selected users"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Activate
        </Button>
        <Button
          variant="slim"
          onClick={() => {
            setCurrentAction('deactivate');
            setIsConfirmOpen(true);
          }}
          disabled={selectedUsers.length === 0}
          aria-label="Deactivate selected users"
        >
          <Ban className="h-4 w-4 mr-2" />
          Deactivate
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {actionDetails && (
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionDetails.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-zinc-400">{actionDetails.description}</p>
            <DialogFooter>
              <Button
                variant="slim"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant={actionDetails.buttonVariant}
                onClick={handleAction}
                disabled={isProcessing}
                aria-label={`Confirm ${currentAction}`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <actionDetails.icon className="mr-2 h-4 w-4" />
                    {actionDetails.buttonText}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
