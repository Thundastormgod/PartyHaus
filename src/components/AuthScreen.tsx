import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Sparkles, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export const AuthScreen = () => {
  console.log('🎨 AUTH_SCREEN: AuthScreen component is rendering');

  // Add conditional motion component logic for better compatibility
  const MotionDiv = process.env.NODE_ENV === 'test' ? 'div' : motion.div;
  const MotionH1 = process.env.NODE_ENV === 'test' ? 'h1' : motion.h1;

  // Debug: log imported symbols to detect undefined imports during tests
  try {
    // eslint-disable-next-line no-console
    console.log('🎯 AUTHSCREEN DEBUG imports', {
      motion: typeof motion,
      usePartyStore: typeof usePartyStore,
      Button: typeof Button,
      Input: typeof Input,
      Card: typeof Card,
      CardContent: typeof CardContent,
      CardHeader: typeof CardHeader,
      CardTitle: typeof CardTitle,
      Music: typeof Music,
      Sparkles: typeof Sparkles,
      Users: typeof Users,
    })
  } catch (e) {
    // ignore
  }

  // During tests, throw a clear error if any necessary import is undefined to help diagnostics
  if (process.env.NODE_ENV === 'test') {
    const required: [string, any][] = [
      ['motion', motion], ['usePartyStore', usePartyStore], ['Button', Button], ['Input', Input],
      ['Card', Card], ['CardContent', CardContent], ['CardHeader', CardHeader], ['CardTitle', CardTitle],
      ['Music', Music], ['Sparkles', Sparkles], ['Users', Users]
    ];
    const missing = required.find(([, v]) => typeof v === 'undefined');
    if (missing) throw new Error(`MISSING_IMPORT: ${missing[0]}`);
  }

  try {

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
        // Don't manually set user here - the auth state change listener will handle it
        // This prevents race conditions and infinite reloads
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
      <MotionDiv
        {...(process.env.NODE_ENV !== 'test' && {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6 }
        })}
        className="w-full max-w-md"
      >
  {/* Hero Section */}
  {(() => { console.log('🎯 AUTHSCREEN RENDER: before hero'); return null })()}
        <MotionDiv
          {...(process.env.NODE_ENV !== 'test' && {
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            transition: { delay: 0.2, duration: 0.6 }
          })}
          className="text-center mb-8"
        >
          <div className="relative">
            <MotionH1 
              className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4"
              {...(process.env.NODE_ENV !== 'test' && {
                animate: { 
                  filter: ["drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))", "drop-shadow(0 0 40px hsl(280 100% 70% / 0.8))", "drop-shadow(0 0 20px hsl(280 100% 70% / 0.5))"]
                },
                transition: { duration: 2, repeat: Infinity }
              })}
            >
              PartyHaus
            </MotionH1>
            {(() => { console.log('🎯 AUTHSCREEN RENDER: after h1'); return null })()}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                animate: { rotate: 360 },
                transition: { duration: 20, repeat: Infinity, ease: "linear" }
              })}
              className="absolute -top-4 -right-4"
            >
              <Sparkles className="h-8 w-8 text-accent animate-neon-flicker" />
            </MotionDiv>
          {(() => { console.log('🎯 AUTHSCREEN RENDER: after sparkles'); return null })()}
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
        </MotionDiv>

        {/* Auth Card */}
        <MotionDiv
          {...(process.env.NODE_ENV !== 'test' && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.4, duration: 0.6 }
          })}
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
                  <MotionDiv
                    {...(process.env.NODE_ENV !== 'test' && {
                      initial: { opacity: 0, height: 0 },
                      animate: { opacity: 1, height: 'auto' },
                      transition: { duration: 0.3 }
                    })}
                  >
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      className="bg-secondary/50 border-primary/30 focus:border-primary"
                    />
                  </MotionDiv>
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
        </MotionDiv>
      </MotionDiv>
    </div>
  );
  } catch (error) {
    console.error('🎨 AUTH_SCREEN: Error in AuthScreen component:', error);
    return <div style={{ padding: '20px', color: 'red' }}>Error in AuthScreen: {error.message}</div>;
  }
};