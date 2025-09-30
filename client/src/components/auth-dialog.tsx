import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LogIn } from 'lucide-react';

interface AuthDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: 'login' | 'register';
}

export function AuthDialog({ trigger, defaultTab = 'login' }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = window.innerWidth < 640;

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest('/api/auth/login', 'POST', loginData);
      toast({
        title: 'Success',
        description: 'Logged in successfully!'
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest('/api/auth/register', 'POST', registerData);
      toast({
        title: 'Success',
        description: 'Account created! Logging you in...'
      });
      // Auto-login after registration
      await apiRequest('/api/auth/login', 'POST', {
        email: registerData.email,
        password: registerData.password
      });
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Please check your details and try again',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="w-full sm:w-auto btn-metallic px-6 py-3 sm:py-2 text-base md:text-lg font-semibold"
            data-testid="button-login"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to CarArth</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  data-testid="input-login-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full btn-metallic" 
                disabled={isLoading}
                data-testid="button-submit-login"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-firstname">First Name</Label>
                <Input
                  id="register-firstname"
                  type="text"
                  placeholder="John"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                  required
                  data-testid="input-register-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-lastname">Last Name</Label>
                <Input
                  id="register-lastname"
                  type="text"
                  placeholder="Doe"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  data-testid="input-register-lastname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  data-testid="input-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="input-register-password"
                />
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>
              <Button 
                type="submit" 
                className="w-full btn-metallic" 
                disabled={isLoading}
                data-testid="button-submit-register"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
