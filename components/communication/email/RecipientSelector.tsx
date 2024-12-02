import { useState, useEffect } from 'react';
import { User, Mail } from 'lucide-react';
import { RecipientSelectorProps } from './types';

const RecipientSelector = ({
  recipientEmail,
  recipientName,
  onRecipientChange,
  disabled = false
}: RecipientSelectorProps) => {
  // Local state for form handling
  const [email, setEmail] = useState(recipientEmail || '');
  const [name, setName] = useState(recipientName || '');
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Update parent component when values change
  useEffect(() => {
    if (isValidEmail && !disabled && isDirty) {
      onRecipientChange(email, name || undefined);
    }
  }, [email, name, isValidEmail, onRecipientChange, disabled, isDirty]);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === '' || emailRegex.test(email);
  };

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      const newEmail = e.target.value;
      setEmail(newEmail);
      setIsValidEmail(validateEmail(newEmail));
      setIsDirty(true);
    }
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      setName(e.target.value);
      setIsDirty(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email Input */}
      <div>
        <label
          htmlFor="recipient-email"
          className="block text-sm font-medium text-gray-700"
        >
          Recipient Email
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="email"
            id="recipient-email"
            value={email}
            onChange={handleEmailChange}
            disabled={disabled}
            className={`
              block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${
                isValidEmail
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-red-300 focus:ring-red-500 focus:border-red-500'
              }
            `}
            placeholder="email@example.com"
          />
          {!isValidEmail && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-red-500">!</span>
            </div>
          )}
        </div>
        {!isValidEmail && (
          <p className="mt-1 text-xs text-red-600">
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Name Input (Optional) */}
      <div>
        <label
          htmlFor="recipient-name"
          className="block text-sm font-medium text-gray-700"
        >
          Recipient Name (Optional)
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            id="recipient-name"
            value={name}
            onChange={handleNameChange}
            disabled={disabled}
            className={`
              block w-full pl-10 pr-3 py-2 sm:text-sm rounded-md
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              border-gray-300 focus:ring-blue-500 focus:border-blue-500
            `}
            placeholder="John Doe"
          />
        </div>
      </div>
    </div>
  );
};

export default RecipientSelector;
