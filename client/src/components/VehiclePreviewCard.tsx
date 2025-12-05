/**
 * Vehicle Preview Card Component
 *
 * Displays fetched vehicle details in a compact, reviewable format.
 * Shows VAHAN-verified badge and allows editing.
 *
 * Features:
 * - Compact display of key vehicle information
 * - VAHAN verification badge
 * - Edit and continue actions
 * - Highlights missing fields that need attention
 * - Responsive and accessible
 */

import { Edit, CheckCircle, AlertCircle, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ListingFormData } from '@/services/vahanService';
import { getMissingFields } from '@/services/vahanService';

interface VehiclePreviewCardProps {
  data: ListingFormData;
  onEdit: () => void;
  onContinue: () => void;
  className?: string;
}

export function VehiclePreviewCard({
  data,
  onEdit,
  onContinue,
  className = '',
}: VehiclePreviewCardProps) {
  const missingFields = getMissingFields(data);
  const hasAllRequiredFields = missingFields.length === 0;

  // Format display values
  const displayYear = data.year || 'N/A';
  const displayOwners = data.ownerCount ? `${data.ownerCount} owner${data.ownerCount !== '1' ? 's' : ''}` : 'N/A';
  const displayFuel = data.fuelType || 'N/A';
  const displayTransmission = data.transmission || 'N/A';
  const displayColor = data.color || 'N/A';

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.brand || 'Unknown'} {data.model || 'Model'}
              </h3>
              {data.vahanVerified && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  VAHAN Verified
                </Badge>
              )}
            </div>
            {data.variant && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.variant}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Registration: {data.registrationNumber}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-shrink-0"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Primary Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Year
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {displayYear}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Fuel
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {displayFuel}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Transmission
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {displayTransmission}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              Owners
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {displayOwners}
            </p>
          </div>
        </div>

        {/* Secondary Details */}
        {(data.color || data.registrationDate) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              {data.color && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Color
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{displayColor}</p>
                </div>
              )}
              {data.registrationDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Registration Date
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(data.registrationDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Missing Fields Alert */}
        {!hasAllRequiredFields && (
          <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">Please confirm or add:</span>{' '}
              {missingFields.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Images Preview (if available) */}
        {data.images && data.images.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
              Images
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.images.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Vehicle image ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ))}
              {data.images.length > 4 && (
                <div className="h-20 w-20 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                  +{data.images.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Car className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Review your details</p>
            <p className="text-blue-700 dark:text-blue-200">
              Please verify all information is correct. You can edit any field before continuing.
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onEdit}
          className="w-full sm:w-auto"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
        <Button
          onClick={onContinue}
          className="w-full sm:flex-1"
          disabled={!hasAllRequiredFields}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirm & Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

export default VehiclePreviewCard;
