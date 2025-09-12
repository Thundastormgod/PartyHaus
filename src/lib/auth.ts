import { supabase } from './supabase';
import { sendEmail, emailTemplates } from './email';

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  } | null;
  error?: string;
  message?: string;
}

export const authService = {
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || email.split('@')[0]
          }
        };
      }

      return {
        success: false,
        error: 'No user returned from authentication'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  signUp: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      if (user) {
        // Send custom welcome email
        await sendEmail(emailTemplates.confirmEmail(
          email,
          `${window.location.origin}/auth/callback?email=${encodeURIComponent(email)}`
        ));

        return {
          success: true,
          message: 'Please check your email to confirm your account!',
          user: null // Don't return user until email is confirmed
        };
      }

      return {
        success: false,
        error: 'No user returned from sign up'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      await sendEmail(emailTemplates.resetPassword(
        email,
        `${window.location.origin}/auth/reset-password?email=${encodeURIComponent(email)}`
      ));

      return {
        success: true,
        message: 'Password reset instructions have been sent to your email'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  signOut: async (): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: 'Successfully signed out'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get the current session user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Verify email confirmation
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
