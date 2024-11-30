'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from '@/hooks/useSession';
import { settingsService } from '@/services/settings/base';
import { accountSchema, type AccountFormData } from '@/types/settings';
import type { ExtendedUser } from '@/types/supabase';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SessionManagement } from '@/components/ui/AccountForms/SessionManagement';
import { AccountSettingsSkeleton } from '@/components/ui/AccountSettingsSkeleton';

export default function AccountSettings() {
  const { session } = useSession();
  const user = session?.user as ExtendedUser;
  const [isLoading, setIsLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    mode: 'onSubmit'
  });

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 0); // Set to 0 for tests

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: AccountFormData) => {
    if (!session?.user?.id) return;

    try {
      setSubmitStatus(null);

      const { error } = await settingsService.account.updatePassword(
        session.user.id,
        data.currentPassword,
        data.newPassword
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Password updated successfully'
      });

      reset();
    } catch (error) {
      console.error('Failed to update password:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update password. Please try again.'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      setIsDeleting(true);
      const { error } = await settingsService.account.deleteAccount(user.id);

      if (error) throw error;

      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to delete account. Please try again.'
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handlePasswordSubmit = async (data: AccountFormData) => {
    try {
      // Validate form data
      const result = accountSchema.safeParse(data);
      if (!result.success) {
        return;
      }

      if (!user?.id) return;

      setSubmitStatus(null);
      const { error } = await settingsService.account.updatePassword(
        user.id,
        data.currentPassword,
        data.newPassword
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Password updated successfully'
      });

      reset();
    } catch (error) {
      console.error('Failed to update password:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update password. Please try again.'
      });
    }
  };

  const confirmPasswordChange = async () => {
    if (!user?.id) return;

    try {
      setSubmitStatus(null);
      const formData = watch();

      const { error } = await settingsService.account.updatePassword(
        user.id,
        formData.currentPassword,
        formData.newPassword
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Password updated successfully'
      });

      reset();
    } catch (error) {
      console.error('Failed to update password:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to update password. Please try again.'
      });
    } finally {
      setPasswordModalOpen(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    try {
      setIsVerifying(true);
      const { error } = await settingsService.account.resendVerification(
        user.email
      );

      if (error) throw error;

      setSubmitStatus({
        type: 'success',
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      console.error('Failed to resend verification:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Failed to send verification email'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <div className="space-y-8 p-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-medium text-gray-900">Account Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account security and preferences
        </p>
      </div>

      {/* Email Section with Loading State */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-900">Email Address</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-sm text-gray-500">
              {user?.email_verified ? 'Verified' : 'Not verified'}
            </p>
          </div>
          {!user?.email_verified && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isVerifying}
              className={`text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 ${
                isVerifying ? 'cursor-wait' : ''
              }`}
            >
              {isVerifying ? 'Sending...' : 'Resend verification'}
            </button>
          )}
        </div>
      </div>

      {/* Password Change Form with Loading State */}
      <form
        onSubmit={handleSubmit(handlePasswordSubmit)}
        className="space-y-6"
        role="form"
      >
        <h3 className="text-base font-medium text-gray-900">Change Password</h3>

        {/* Current Password */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            {...register('currentPassword')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.currentPassword && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            {...register('newPassword')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.newPassword && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            {...register('confirmPassword')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.confirmPassword && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
              isSubmitting ? 'cursor-wait' : ''
            }`}
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>

        {/* Status Messages */}
        {submitStatus && (
          <div
            role="alert"
            className={`mt-4 p-4 rounded-md ${
              submitStatus.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {submitStatus.message}
          </div>
        )}
      </form>

      {/* Session Management */}
      <div className="pt-6 border-t border-gray-200">
        <SessionManagement />
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-base font-medium text-red-600">Danger Zone</h3>
        <p className="mt-1 text-sm text-gray-500">
          Permanently delete your account and all associated data
        </p>
        <button
          type="button"
          className="mt-4 px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={() => setDeleteModalOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Account'}
        cancelLabel="Cancel"
        isDangerous
      />

      {/* Password Change Confirmation Modal */}
      <ConfirmationModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={confirmPasswordChange}
        title="Change Password"
        message="Are you sure you want to change your password? You will be logged out of all other devices."
        confirmLabel="Change Password"
        cancelLabel="Cancel"
      />
    </div>
  );
}
