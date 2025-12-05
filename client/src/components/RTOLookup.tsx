/**
 * RTO/Registration Number Lookup Component
 *
 * Allows users to fetch vehicle details from VAHAN by entering registration number.
 * Features:
 * - Input validation with inline error messages
 * - Loading states with spinner
 * - Error handling with retry/manual fallback
 * - Accessible (aria-live, labels, keyboard navigation)
 * - Responsive and dark mode support
 */

import { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  fetchVahanDetails,
  validateRegistrationNumber,
  normalizeRegistrationNumber,
  getErrorMessage,
  type VahanResponse,
  type VahanError,
} from '@/services/vahanService';

interface RTOLookupProps {
  onSuccess: (data: VahanResponse) => void;
  onManualEntry: (regNumber?: string) => void;
  className?: string;
}

export function RTOLookup({ onSuccess, onManualEntry, className = '' }: RTOLookupProps) {
  const [regNumber, setRegNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ title: string; message: string; action: string } | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const handleInputChange = (value: string) => {
    setRegNumber(value);
    setValidationError('');
    setError(null);
  };

  const handleLookup = async () => {
    // Clear previous errors
    setError(null);
    setValidationError('');

    // Normalize input
    const normalized = normalizeRegistrationNumber(regNumber);

    // Validate
    const validation = validateRegistrationNumber(normalized);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid registration number');
      return;
    }

    // Fetch from VAHAN
    setIsLoading(true);

    try {
      const response = await fetchVahanDetails(normalized);

      if (response.status === 'ok' && response.vehicle) {
        onSuccess(response);
      } else if (response.status === 'not_found') {
        setError({
          title: 'Vehicle not found',
          message: 'We could not find this registration in VAHAN records. You can enter details manually.',
          action: 'manual',
        });
      } else {
        setError({
          title: 'Lookup failed',
          message: response.message || 'Unable to fetch vehicle details. Please try again or enter manually.',
          action: 'retry',
        });
      }
    } catch (err: any) {
      const vahanError = err as VahanError;
      const errorInfo = getErrorMessage(vahanError);
      setError(errorInfo);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLookup();
    }
  };

  const handleManualEntry = () => {
    onManualEntry(regNumber ? normalizeRegistrationNumber(regNumber) : undefined);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          List Your Car
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400">
          Enter your vehicle registration number to fetch details automatically
        </p>
      </div>

      {/* Main lookup card */}
      <div className="card-base p-6 sm:p-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="reg-number-input"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              RTO / Registration Number
            </label>
            <div className="relative">
              <Input
                id="reg-number-input"
                type="text"
                value={regNumber}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., MH12AB1234"
                disabled={isLoading}
                className={`w-full h-12 px-4 text-base font-medium uppercase ${
                  validationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                aria-invalid={!!validationError}
                aria-describedby={validationError ? 'reg-number-error' : undefined}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {validationError && (
              <p id="reg-number-error" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {validationError}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Format: 2 letters + 2 digits + 1-2 letters + 1-4 digits (e.g., DL01CA9999, KA03MH7777)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleLookup}
              disabled={isLoading || !regNumber.trim()}
              className="flex-1 h-12 text-base font-semibold"
              data-testid="fetch-details-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fetching details...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Fetch Details
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleManualEntry}
              disabled={isLoading}
              className="flex-1 sm:flex-initial h-12 text-base font-semibold"
              data-testid="manual-entry-btn"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Enter Manually
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mt-6"
            role="alert"
            aria-live="polite"
          >
            <Alert variant={error.action === 'manual' ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{error.title}</AlertTitle>
              <AlertDescription className="mt-2">
                {error.message}
              </AlertDescription>
              <div className="mt-4 flex flex-wrap gap-2">
                {error.action === 'retry' && (
                  <Button
                    onClick={handleLookup}
                    size="sm"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                )}
                {(error.action === 'manual' || error.action === 'retry') && (
                  <Button
                    onClick={handleManualEntry}
                    size="sm"
                    variant={error.action === 'manual' ? 'default' : 'outline'}
                  >
                    Enter Details Manually
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Instant verification with VAHAN</p>
              <p className="text-blue-700 dark:text-blue-200">
                We'll automatically fetch your vehicle's make, model, year, fuel type, and other details
                from the government registry. You can review and edit before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Note */}
      <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        Your registration details are encrypted and never shared with third parties
      </p>
    </div>
  );
}

export default RTOLookup;
