import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { setUser, setLoading, isLoading } = usePartyStore();

  const validateForm = () => {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!isLogin && !name.trim()) {
      throw new Error('Please enter your name');
    }
  };

  const { signIn, signUp } = useAuth();
  const { setCurrentPage } = usePartyStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      validateForm();

      if (isLogin) {
        const { user, error } = await signIn(email, password);
        if (error) throw error;
        if (user) {
          // Set user in Zustand store immediately for instant dashboard routing
          await setUser({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email?.split('@')[0],
            user_metadata: user.user_metadata
          });
        }
      } else {
        const { user, error } = await signUp(email, password);
        if (error) throw error;
        if (user) {
          alert('Please check your email to confirm your account!');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
  // ...removed bloatware error log...
      const errorMessage = error.message || 'An error occurred during authentication';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="relative">
            <motion.h1 
              className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4"
              animate={{ 
                filter: ["drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))", "drop-shadow(0 0 40px hsl(280 100% 70% / 0.8))", "drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PartyHaus
            </motion.h1>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-4 -right-4"
            >
              <Sparkles className="h-8 w-8 text-accent animate-neon-flicker" />
            </motion.div>
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            Plan. Party. Perfect.
          </p>
          <div className="flex justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Music className="h-4 w-4 mr-1 text-primary" />
              Spotify Integration
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-accent" />
              QR Check-ins
            </div>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="glass border-primary/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isLogin ? 'Welcome Back' : 'Join the Party'}
              </CardTitle>
              <CardDescription>
                {isLogin ? 'Sign in to manage your events' : 'Create your account to start planning'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="bg-secondary/50 border-primary/30 focus:border-primary"
                    />
                  </motion.div>
                )}
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-secondary/50 border-primary/30 focus:border-primary"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="bg-secondary/50 border-primary/30 focus:border-primary"
                />
                <Button
                  type="submit"
                  className="w-full btn-party text-lg font-semibold h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Start Planning' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};