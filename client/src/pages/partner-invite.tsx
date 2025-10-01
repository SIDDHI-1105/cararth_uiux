import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

export default function PartnerInvite() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInviteInfo();
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(`/api/partner/invite/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid invite link');
      } else {
        setInviteInfo(data.invite);
      }
    } catch (err) {
      setError('Failed to load invite information');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const response = await apiRequest('/api/partner/accept-invite', {
        method: 'POST',
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invite');
      }

      toast({
        title: 'Welcome to CarArth Partner Portal!',
        description: 'Your account is ready. Start adding listings now.',
      });

      setLocation('/partner/dashboard');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Invite Not Valid
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <Button
            onClick={() => setLocation('/')}
            data-testid="button-go-home"
          >
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚗</div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Welcome to CarArth
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Partner Portal
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
            You've been invited to join:
          </h2>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {inviteInfo?.sourceName}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            What you can do:
          </h3>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Add your car listings in minutes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Changes appear on CarArth.com instantly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Manage all your inventory in one place</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✅</span>
              <span>Update or remove listings anytime</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full text-lg py-6"
          data-testid="button-accept-invite"
        >
          {accepting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Setting up your account...
            </>
          ) : (
            'Accept & Get Started'
          )}
        </Button>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          By accepting, you agree to manage car listings responsibly on CarArth
        </p>
      </Card>
    </div>
  );
}
