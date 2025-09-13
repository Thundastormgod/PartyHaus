import { Resend } from 'resend';

// Email service that uses the backend API instead of exposing API keys
// No longer exposing Resend API key on frontend

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailTemplate) => {
  try {
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
  // ...removed bloatware error log...
    return { success: false, error };
  }
};

export const emailTemplates = {
  confirmEmail: (email: string, confirmationUrl: string) => ({
    to: email,
    subject: 'Welcome to PartyHaus - Confirm Your Email',
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1b41;">
        <h1 style="color: #8a2be2;">Welcome to PartyHaus! 🎉</h1>
        <p>Thanks for joining the party! Just one more step to get started.</p>
        <p>Click the button below to confirm your email address:</p>
        <a href="${confirmationUrl}" 
           style="display: inline-block; 
                  background: #8a2be2; 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  text-decoration: none; 
                  margin: 16px 0;">
          Confirm Email
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          If you didn't create an account with PartyHaus, you can safely ignore this email.
        </p>
      </div>
    `,
  }),
  
  resetPassword: (email: string, resetUrl: string) => ({
    to: email,
    subject: 'Reset Your PartyHaus Password',
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1b41;">
        <h1 style="color: #8a2be2;">Reset Your Password</h1>
        <p>We received a request to reset your password for PartyHaus.</p>
        <p>Click the button below to choose a new password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; 
                  background: #8a2be2; 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  text-decoration: none; 
                  margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  }),

  eventInvitation: (email: string, eventDetails: { name: string, date: string, location: string }, rsvpUrl: string) => ({
    to: email,
    subject: `You're Invited to ${eventDetails.name}!`,
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1b41;">
        <h1 style="color: #8a2be2;">You're Invited! 🎉</h1>
        <div style="margin: 24px 0; padding: 24px; background: #f7f7ff; border-radius: 8px;">
          <h2 style="margin: 0; color: #1a1b41;">${eventDetails.name}</h2>
          <p style="margin: 8px 0;">📅 ${eventDetails.date}</p>
          <p style="margin: 8px 0;">📍 ${eventDetails.location}</p>
        </div>
        <p>Ready to join the fun?</p>
        <a href="${rsvpUrl}" 
           style="display: inline-block; 
                  background: #8a2be2; 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 6px; 
                  text-decoration: none; 
                  margin: 16px 0;">
          RSVP Now
        </a>
      </div>
    `,
  }),
};
