import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Music, 
  Sparkles, 
  Users, 
  ArrowRight, 
  Calendar,
  Gamepad2,
  Camera,
  QrCode,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface AuthScreenProps {
  initialMode?: 'landing' | 'auth';
  userIntent?: 'create_event' | 'join_event' | 'explore_features';
  onBackToLanding?: () => void;
}

export const AuthScreen = ({ 
  initialMode = 'landing', 
  userIntent = 'explore_features',
  onBackToLanding 
}: AuthScreenProps) => {
  console.log('🎨 AUTH_SCREEN: AuthScreen component is rendering');

  // Add conditional motion component logic for better compatibility
  const MotionDiv = process.env.NODE_ENV === 'test' ? 'div' : motion.div;
  const MotionH1 = process.env.NODE_ENV === 'test' ? 'h1' : motion.h1;

  // Debug: log imported symbols to detect undefined imports during tests
  try {
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
    const [mode, setMode] = useState<'landing' | 'auth'>(initialMode);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isFormValid, setIsFormValid] = useState(false);
    
    const { setUser, setLoading, isLoading } = usePartyStore();
    const { signIn, signUp } = useAuth();
    const { setCurrentPage } = usePartyStore();

    // Real-time validation
    useEffect(() => {
      const errors: Record<string, string> = {};
      
      if (email && !email.includes('@')) {
        errors.email = 'Please enter a valid email address';
      }
      
      if (password && password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!isLogin && name && name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }

      setValidationErrors(errors);
      setIsFormValid(
        email.includes('@') && 
        password.length >= 6 && 
        (isLogin || name.trim().length >= 2)
      );
    }, [email, password, name, isLogin]);

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

    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        validateForm();

        if (isLogin) {
          const { user, error } = await signIn(email, password);
          if (error) throw error;
        } else {
          const { user, error } = await signUp(email, password, name);
          if (error) throw error;
          if (user) {
            alert('Please check your email to confirm your account!');
            setIsLogin(true);
          }
        }
      } catch (error: any) {
        const errorMessage = error.message || 'An error occurred during authentication';
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    const getWelcomeMessage = () => {
      switch (userIntent) {
        case 'create_event':
          return {
            title: isLogin ? "Ready to Create Something Amazing?" : "Join the Party Creators",
            subtitle: isLogin ? "Sign in to start planning your perfect event" : "Create your account and start planning incredible events",
            benefits: ["Complete event management", "Interactive gaming platform", "Memory creation tools"]
          };
        case 'join_event':
          return {
            title: isLogin ? "Welcome Back!" : "You're Invited to Join!",
            subtitle: isLogin ? "Sign in to access your events" : "Create your account to RSVP and connect",
            benefits: ["RSVP to events", "Play interactive games", "Share and create memories"]
          };
        default:
          return {
            title: isLogin ? "Welcome to PartyHaus" : "Join the PartyHaus Family",
            subtitle: isLogin ? "Sign in to continue your journey" : "Create your account to get started",
            benefits: ["Smart event planning", "Social gaming platform", "Lasting connections"]
          };
      }
    };

    const welcomeMessage = getWelcomeMessage();

    if (mode === 'landing') {
      return (
        <div className="hero-cosmic">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <MotionDiv 
              className="absolute top-20 left-20 w-32 h-32 rounded-full bg-electric-purple blur-3xl"
              {...(process.env.NODE_ENV !== 'test' && {
                animate: { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] },
                transition: { duration: 4, repeat: Infinity }
              })}
            />
            <MotionDiv 
              className="absolute top-40 right-32 w-24 h-24 rounded-full bg-electric-cyan blur-2xl"
              {...(process.env.NODE_ENV !== 'test' && {
                animate: { scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] },
                transition: { duration: 3, repeat: Infinity, delay: 1 }
              })}
            />
            <MotionDiv 
              className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-electric-gold blur-3xl"
              {...(process.env.NODE_ENV !== 'test' && {
                animate: { scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] },
                transition: { duration: 5, repeat: Infinity, delay: 2 }
              })}
            />
          </div>

          <div className="hero-content">
            {/* Logo and Branding */}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.2 }
              })}
              className="text-center mb-12"
            >
              <MotionDiv
                className="inline-flex items-center justify-center mb-6"
                {...(process.env.NODE_ENV !== 'test' && {
                  whileHover: { scale: 1.05 },
                  transition: { type: "spring", stiffness: 300 }
                })}
              >
                <Sparkles className="h-12 w-12 mr-4 text-electric-gold animate-pulse" />
                <MotionH1 
                  className="logo-cosmic text-6xl md:text-8xl lg:text-9xl font-bold"
                  {...(process.env.NODE_ENV !== 'test' && {
                    animate: { 
                      filter: [
                        "drop-shadow(0 0 20px hsl(270 100% 65% / 0.5))", 
                        "drop-shadow(0 0 40px hsl(45 100% 65% / 0.7))", 
                        "drop-shadow(0 0 20px hsl(270 100% 65% / 0.5))"
                      ]
                    },
                    transition: { duration: 3, repeat: Infinity }
                  })}
                >
                  PartyHaus
                </MotionH1>
                <Sparkles className="h-12 w-12 ml-4 text-electric-magenta animate-pulse delay-500" />
              </MotionDiv>
              
              <MotionDiv 
                {...(process.env.NODE_ENV !== 'test' && {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.8, delay: 0.6 }
                })}
              >
                <p className="text-2xl md:text-3xl lg:text-4xl font-light text-cosmic-secondary mb-4">
                  Where Every Event Becomes Unforgettable
                </p>
                <p className="text-lg md:text-xl text-cosmic-secondary max-w-2xl mx-auto">
                  The premium event platform combining smart planning, interactive gaming, 
                  and magical memory creation.
                </p>
              </MotionDiv>
            </MotionDiv>

            {/* Quick Features Preview */}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 0.8 }
              })}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
            >
              {[
                { icon: Calendar, title: "Smart Planning", desc: "AI-powered event management" },
                { icon: Gamepad2, title: "Interactive Games", desc: "30+ engaging experiences" },
                { icon: Camera, title: "Memory Creation", desc: "Automatic photo & video compilation" }
              ].map((feature, index) => (
                <MotionDiv
                  key={feature.title}
                  {...(process.env.NODE_ENV !== 'test' && {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 1.0 + index * 0.2 },
                    whileHover: { y: -5 }
                  })}
                  className="text-center p-6 rounded-xl bg-cosmic-medium/50 backdrop-blur-sm border border-electric-purple/20"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-electric-purple to-electric-magenta flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-cosmic-primary mb-2">{feature.title}</h3>
                  <p className="text-cosmic-secondary text-sm">{feature.desc}</p>
                </MotionDiv>
              ))}
            </MotionDiv>

            {/* CTA Buttons */}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.6, delay: 1.4 }
              })}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={() => setMode('auth')}
                className="btn-cosmic-primary text-lg px-8 py-4 group"
                size="lg"
              >
                Start Planning Your Event
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                onClick={() => { setMode('auth'); setIsLogin(true); }}
                variant="outline"
                className="text-lg px-8 py-4 border-electric-cyan text-electric-cyan hover:bg-electric-cyan hover:text-cosmic-deep transition-all duration-300"
                size="lg"
              >
                Sign In
              </Button>
            </MotionDiv>
          </div>
        </div>
      );
    }

    // Auth Mode
    return (
      <div className="hero-cosmic">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-electric-purple blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-electric-gold blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="hero-content">
          <MotionDiv
            {...(process.env.NODE_ENV !== 'test' && {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.6 }
            })}
            className="w-full max-w-lg mx-auto"
          >
            {/* Back to Landing */}
            {onBackToLanding && (
              <MotionDiv
                {...(process.env.NODE_ENV !== 'test' && {
                  initial: { opacity: 0, x: -20 },
                  animate: { opacity: 1, x: 0 }
                })}
                className="mb-6"
              >
                <Button
                  variant="ghost"
                  onClick={onBackToLanding}
                  className="text-cosmic-secondary hover:text-electric-cyan transition-colors"
                >
                  ← Back to Home
                </Button>
              </MotionDiv>
            )}

            {/* Logo */}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: 0.2, duration: 0.6 }
              })}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 mr-3 text-electric-gold" />
                <h1 className="logo-cosmic text-4xl md:text-5xl font-bold">
                  PartyHaus
                </h1>
                <Sparkles className="h-8 w-8 ml-3 text-electric-magenta" />
              </div>
              <p className="text-cosmic-secondary">
                Plan. Party. Perfect.
              </p>
            </MotionDiv>

            {/* Auth Card */}
            <MotionDiv
              {...(process.env.NODE_ENV !== 'test' && {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.4, duration: 0.6 }
              })}
            >
              <Card className="card-cosmic border-electric-purple/20">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-gradient">
                    {welcomeMessage.title}
                  </CardTitle>
                  <CardDescription className="text-cosmic-secondary text-base">
                    {welcomeMessage.subtitle}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <form onSubmit={handleAuth} className="space-y-5">
                    {/* Name Field for Registration */}
                    {!isLogin && (
                      <MotionDiv
                        {...(process.env.NODE_ENV !== 'test' && {
                          initial: { opacity: 0, height: 0 },
                          animate: { opacity: 1, height: 'auto' },
                          exit: { opacity: 0, height: 0 },
                          transition: { duration: 0.3 }
                        })}
                        className="space-y-2"
                      >
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-secondary" />
                          <Input
                            type="text"
                            placeholder="Your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            className={`input-cosmic pl-10 ${validationErrors.name ? 'border-error-red' : 'border-electric-purple/30'}`}
                          />
                          {name && !validationErrors.name && (
                            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-success-green" />
                          )}
                        </div>
                        {validationErrors.name && (
                          <p className="text-error-red text-sm flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {validationErrors.name}
                          </p>
                        )}
                      </MotionDiv>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-secondary" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className={`input-cosmic pl-10 ${validationErrors.email ? 'border-error-red' : 'border-electric-purple/30'}`}
                        />
                        {email && !validationErrors.email && (
                          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-success-green" />
                        )}
                      </div>
                      {validationErrors.email && (
                        <p className="text-error-red text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-secondary" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          className={`input-cosmic pl-10 pr-10 ${validationErrors.password ? 'border-error-red' : 'border-electric-purple/30'}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-cosmic-secondary" />
                          ) : (
                            <Eye className="h-4 w-4 text-cosmic-secondary" />
                          )}
                        </Button>
                      </div>
                      {validationErrors.password && (
                        <p className="text-error-red text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {validationErrors.password}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className={`w-full text-lg font-semibold h-12 transition-all duration-300 ${
                        isFormValid ? 'btn-cosmic-primary' : 'bg-cosmic-light text-cosmic-secondary cursor-not-allowed'
                      }`}
                      disabled={isLoading || !isFormValid}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="cosmic-spinner w-5 h-5" />
                          <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>{isLogin ? 'Sign In & Start Planning' : 'Create Account'}</span>
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Benefits Preview */}
                  <div className="pt-4 border-t border-electric-purple/20">
                    <p className="text-cosmic-secondary text-sm text-center mb-3">
                      What you'll get:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {welcomeMessage.benefits.map((benefit, index) => (
                        <div key={benefit} className="flex items-center text-cosmic-secondary text-sm">
                          <CheckCircle className="h-4 w-4 text-electric-gold mr-2 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Auth Mode */}
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-electric-cyan hover:text-electric-gold transition-colors text-sm"
                    >
                      {isLogin ? "Don't have an account? Create one here" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          </MotionDiv>
        </div>
      </div>
    );
  } catch (error) {
    console.error('🎨 AUTH_SCREEN: Error in AuthScreen component:', error);
    return <div style={{ padding: '20px', color: 'red' }}>Error in AuthScreen: {error.message}</div>;
  }
};