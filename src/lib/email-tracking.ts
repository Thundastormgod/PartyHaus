// Enhanced email service with comprehensive status tracking
import { Resend } from 'resend';
import { supabase } from './supabase';
import { getEmailOptimizedImageUrl } from './image-utils';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export interface EmailLogData {
  eventId?: string;
  guestId?: string;
  emailType: 'invitation' | 'confirmation' | 'reminder' | 'test';
  recipientEmail: string;
  subject: string;
}

export interface EmailStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  errorMessage?: string;
}

// Enhanced email sending with database logging
export const sendEmailWithTracking = async ({ to, subject, html }: EmailTemplate, logData: EmailLogData) => {
  try {
    // First, create email log entry
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        event_id: logData.eventId,
        guest_id: logData.guestId,
        email_type: logData.emailType,
        recipient_email: logData.recipientEmail,
        subject: logData.subject,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create email log:', logError);
      throw new Error('Database logging failed');
    }

    console.log('📝 Email log created:', emailLog.id);

    // Use Vercel serverless function in production, fallback to localhost in development
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/email' 
      : 'http://localhost:3001/api/send-email';
      
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Update email log with failure
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: data.error || `HTTP error! status: ${response.status}`
        })
        .eq('id', emailLog.id);

      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    if (!data.success) {
      // Update email log with failure
      await supabase
        .from('email_logs')
        .update({
          status: 'failed',
          error_message: data.error || 'Email sending failed'
        })
        .eq('id', emailLog.id);

      throw new Error(data.error || 'Email sending failed');
    }
    
    // Update email log with success and Resend email ID
    const resendEmailId = data.data?.id || data.id;
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        resend_email_id: resendEmailId,
        sent_at: new Date().toISOString()
      })
      .eq('id', emailLog.id);

    // Update guest email status if guest_id provided
    if (logData.guestId) {
      await supabase
        .from('guests')
        .update({
          email_status: 'sent',
          last_email_sent_at: new Date().toISOString(),
          email_log_id: emailLog.id
        })
        .eq('id', logData.guestId);
    }
    
    console.log('✅ Email sent successfully with tracking:', {
      emailLogId: emailLog.id,
      resendEmailId,
      recipient: to
    });
    
    return {
      ...data,
      emailLogId: emailLog.id,
      resendEmailId
    };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

// Fallback for existing email function (backward compatibility)
export const sendEmail = async ({ to, subject, html }: EmailTemplate) => {
  try {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/email' 
      : 'http://localhost:3001/api/send-email';
      
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Email sending failed');
    }
    
    console.log('Email sent successfully:', data);
    return data;
    
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error; // Re-throw to allow caller to handle
  }
};

// Get email status by email log ID
export const getEmailStatus = async (emailLogId: string): Promise<EmailStatus | null> => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select(`
        id,
        status,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        error_message
      `)
      .eq('id', emailLogId)
      .single();

    if (error) {
      console.error('Failed to get email status:', error);
      return null;
    }

    return {
      id: data.id,
      status: data.status,
      sentAt: data.sent_at,
      deliveredAt: data.delivered_at,
      openedAt: data.opened_at,
      clickedAt: data.clicked_at,
      bouncedAt: data.bounced_at,
      errorMessage: data.error_message
    };
  } catch (error) {
    console.error('Error fetching email status:', error);
    return null;
  }
};

// Get email analytics for an event
export const getEmailAnalytics = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from('email_analytics')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error) {
      console.error('Failed to get email analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching email analytics:', error);
    return null;
  }
};

// Get detailed email logs for an event
export const getEventEmailLogs = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select(`
        *,
        guests:guest_id (
          name,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Failed to get email logs:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }
};

// Resend failed email
export const resendEmail = async (emailLogId: string) => {
  try {
    // Get original email log
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .select(`
        *,
        guests:guest_id (
          name,
          email
        ),
        events:event_id (
          name,
          event_date,
          location,
          invite_image_url
        )
      `)
      .eq('id', emailLogId)
      .single();

    if (logError || !emailLog) {
      throw new Error('Email log not found');
    }

    // Determine email template and data
    let template;
    const eventDetails = {
      name: emailLog.events?.name || 'Event',
      date: new Date(emailLog.events?.event_date || '').toLocaleDateString(),
      location: emailLog.events?.location || 'TBD'
    };

    switch (emailLog.email_type) {
      case 'invitation':
        const invitationUrl = `${window.location.origin}/rsvp/${emailLog.event_id}/${emailLog.guest_id}`;
        template = emailTemplates.eventInvitation(
          emailLog.recipient_email,
          eventDetails,
          invitationUrl,
          emailLog.events?.invite_image_url
        );
        break;
      case 'confirmation':
        template = emailTemplates.rsvpConfirmation(
          emailLog.recipient_email,
          eventDetails,
          emailLog.guests?.name || 'Guest'
        );
        break;
      case 'reminder':
        template = emailTemplates.eventReminder(
          emailLog.recipient_email,
          eventDetails,
          emailLog.guests?.name || 'Guest'
        );
        break;
      default:
        throw new Error('Unsupported email type for resend');
    }

    // Send email with tracking
    return await sendEmailWithTracking(template, {
      eventId: emailLog.event_id,
      guestId: emailLog.guest_id,
      emailType: emailLog.email_type as any,
      recipientEmail: emailLog.recipient_email,
      subject: template.subject
    });

  } catch (error) {
    console.error('Failed to resend email:', error);
    throw error;
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

  eventInvitation: (email: string, eventDetails: { name: string, date: string, location: string }, rsvpUrl: string, inviteImageUrl?: string) => ({
    to: email,
    subject: `🎉 You're Invited to ${eventDetails.name}!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Party Invitation</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1b41;
            background: ${inviteImageUrl ? '#f5f5f5' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            padding: 20px;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: ${inviteImageUrl ? '12px' : '20px'};
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          /* Custom invite image header */
          .custom-invite-header {
            position: relative;
            overflow: hidden;
            border-radius: 12px 12px 0 0;
          }
          
          .custom-invite-image {
            width: 100%;
            height: auto;
            max-height: 400px;
            object-fit: cover;
            display: block;
          }
          
          .invite-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(transparent, rgba(0,0,0,0.7));
            padding: 30px 20px 20px;
            color: white;
          }
          
          .invite-overlay h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          }
          
          .invite-overlay p {
            font-size: 16px;
            opacity: 0.95;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          }
          
          /* Standard header (when no custom image) */
          .standard-header {
            background: linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .standard-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="90" r="2.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="1.8" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            animation: float 20s linear infinite;
          }
          
          @keyframes float {
            0% { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(-50px, -50px) rotate(360deg); }
          }
          
          .party-icon {
            font-size: 48px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
          }
          
          .standard-header h1 {
            color: white;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .standard-header p {
            color: rgba(255,255,255,0.9);
            font-size: 18px;
            font-weight: 500;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: ${inviteImageUrl ? '30px 30px 40px' : '40px 30px'};
          }
          
          .invitation-text {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .invitation-text h2 {
            font-size: 24px;
            color: #1a1b41;
            margin-bottom: 12px;
            font-weight: 600;
          }
          
          .invitation-text p {
            font-size: 16px;
            color: #666;
            line-height: 1.5;
          }
          
          .event-card {
            background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            border: 1px solid #e1e8f0;
            position: relative;
            overflow: hidden;
          }
          
          .event-card::before {
            content: '🎊';
            position: absolute;
            top: 15px;
            right: 15px;
            font-size: 24px;
            opacity: 0.3;
          }
          
          .event-title {
            font-size: ${inviteImageUrl ? '24px' : '28px'};
            font-weight: 700;
            color: #1a1b41;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .event-details {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          
          .detail-icon {
            font-size: 20px;
            width: 32px;
            text-align: center;
          }
          
          .detail-text {
            font-weight: 500;
            color: #1a1b41;
            font-size: 16px;
          }
          
          .rsvp-section {
            text-align: center;
            margin: 30px 0;
          }
          
          .rsvp-text {
            font-size: 18px;
            color: #1a1b41;
            margin-bottom: 20px;
            font-weight: 500;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%);
            color: white;
            padding: 16px 40px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 18px;
            box-shadow: 0 8px 20px rgba(108, 99, 255, 0.3);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .cta-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
          }
          
          .cta-button:hover::before {
            left: 100%;
          }
          
          .features {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
          }
          
          .feature {
            text-align: center;
            flex: 1;
            min-width: 120px;
          }
          
          .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .feature-text {
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }
          
          .footer {
            background: #f8f9ff;
            padding: ${inviteImageUrl ? '20px 30px' : '25px 30px'};
            text-align: center;
            border-top: 1px solid #e1e8f0;
          }
          
          .footer p {
            color: #666;
            font-size: ${inviteImageUrl ? '12px' : '14px'};
            margin-bottom: ${inviteImageUrl ? '4px' : '8px'};
          }
          
          .footer .brand {
            color: #6C63FF;
            font-weight: 600;
            text-decoration: none;
            opacity: ${inviteImageUrl ? '0.8' : '1'};
          }
          
          @media (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: ${inviteImageUrl ? '8px' : '15px'};
            }
            
            .standard-header {
              padding: 30px 20px;
            }
            
            .standard-header h1 {
              font-size: 26px;
            }
            
            .invite-overlay {
              padding: 20px 15px 15px;
            }
            
            .invite-overlay h1 {
              font-size: 24px;
            }
            
            .content {
              padding: ${inviteImageUrl ? '25px 20px 30px' : '30px 20px'};
            }
            
            .event-card {
              padding: 20px;
            }
            
            .event-title {
              font-size: ${inviteImageUrl ? '20px' : '24px'};
            }
            
            .features {
              gap: 20px;
            }
            
            .cta-button {
              padding: 14px 30px;
              font-size: 16px;
            }
            
            .custom-invite-image {
              max-height: 300px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${inviteImageUrl ? `
            <!-- Custom Invite Image Header -->
            <div class="custom-invite-header">
              <img src="${getEmailOptimizedImageUrl(inviteImageUrl)}" alt="Event Invitation" class="custom-invite-image" />
              <div class="invite-overlay">
                <h1>You're Invited!</h1>
                <p>A special invitation just for you</p>
              </div>
            </div>
          ` : `
            <!-- Standard Header -->
            <div class="standard-header">
              <div class="party-icon">🎉</div>
              <h1>You're Invited!</h1>
              <p>Get ready for an amazing party experience</p>
            </div>
          `}
          
          <div class="content">
            ${!inviteImageUrl ? `
              <div class="invitation-text">
                <h2>Join us for an unforgettable celebration!</h2>
                <p>We're excited to invite you to our special event. Don't miss out on the fun, games, and great company!</p>
              </div>
            ` : `
              <div class="invitation-text">
                <h2>Event Details</h2>
                <p>Mark your calendar and get ready for an amazing time!</p>
              </div>
            `}
            
            <div class="event-card">
              <div class="event-title">${eventDetails.name}</div>
              <div class="event-details">
                <div class="detail-item">
                  <div class="detail-icon">📅</div>
                  <div class="detail-text">${eventDetails.date}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon">📍</div>
                  <div class="detail-text">${eventDetails.location}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon">🎵</div>
                  <div class="detail-text">Live Music & Entertainment</div>
                </div>
              </div>
            </div>
            
            <div class="rsvp-section">
              <div class="rsvp-text">Ready to join the party?</div>
              <a href="${rsvpUrl}" class="cta-button">
                ✨ RSVP Now ✨
              </a>
            </div>
            
            ${!inviteImageUrl ? `
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">🎯</div>
                  <div class="feature-text">Interactive Games</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">🎵</div>
                  <div class="feature-text">Spotify Playlists</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">📱</div>
                  <div class="feature-text">QR Check-in</div>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Powered by <a href="#" class="brand">PartyHaus</a></p>
            ${!inviteImageUrl ? '<p>Plan. Party. Perfect.</p>' : ''}
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  rsvpConfirmation: (email: string, eventDetails: { name: string, date: string, location: string }, guestName: string) => ({
    to: email,
    subject: `✅ RSVP Confirmed for ${eventDetails.name}!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RSVP Confirmed</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1b41;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          
          .success-icon {
            font-size: 64px;
            margin-bottom: 15px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          
          .confirmation-card {
            background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 20px 0;
            border-left: 5px solid #4CAF50;
          }
          
          .event-title {
            font-size: 24px;
            font-weight: 700;
            color: #1a1b41;
            margin-bottom: 15px;
          }
          
          .next-steps {
            background: #f8f9ff;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            text-align: left;
          }
          
          .next-steps h3 {
            color: #1a1b41;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .next-steps ul {
            color: #666;
            padding-left: 20px;
          }
          
          .next-steps li {
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>RSVP Confirmed!</h1>
            <p>We can't wait to see you there, ${guestName}!</p>
          </div>
          
          <div class="content">
            <div class="confirmation-card">
              <div class="event-title">${eventDetails.name}</div>
              <p><strong>📅 Date:</strong> ${eventDetails.date}</p>
              <p><strong>📍 Location:</strong> ${eventDetails.location}</p>
            </div>
            
            <div class="next-steps">
              <h3>What's Next?</h3>
              <ul>
                <li>Save the date in your calendar</li>
                <li>We'll send you a reminder closer to the event</li>
                <li>Look out for QR check-in details</li>
                <li>Get ready for an amazing time! 🎉</li>
              </ul>
            </div>
            
            <p style="color: #666; margin-top: 30px;">
              Questions? Just reply to this email and we'll help you out!
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  eventReminder: (email: string, eventDetails: { name: string, date: string, location: string }, guestName: string, qrUrl?: string) => ({
    to: email,
    subject: `🎊 Don't forget! ${eventDetails.name} is tomorrow!`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Reminder</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1b41;
            background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
            padding: 20px;
            margin: 0;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          
          .reminder-icon {
            font-size: 64px;
            margin-bottom: 15px;
          }
          
          .countdown {
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 15px;
            margin: 20px 0;
            font-size: 24px;
            font-weight: 700;
          }
          
          .qr-section {
            background: #f8f9ff;
            border-radius: 16px;
            padding: 25px;
            margin: 25px 0;
            text-align: center;
          }
          
          .qr-code {
            background: white;
            padding: 20px;
            border-radius: 12px;
            display: inline-block;
            margin: 15px 0;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="reminder-icon">⏰</div>
            <h1>Party Reminder!</h1>
            <div class="countdown">Tomorrow's the day!</div>
            <p>Hey ${guestName}, don't forget about the party!</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <div style="background: linear-gradient(135deg, #fff5f5 0%, #fffacd 100%); border-radius: 16px; padding: 25px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; color: #1a1b41;">${eventDetails.name}</h2>
              <p style="margin: 5px 0;"><strong>📅 Tomorrow:</strong> ${eventDetails.date}</p>
              <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${eventDetails.location}</p>
            </div>
            
            ${qrUrl ? `
            <div class="qr-section">
              <h3 style="color: #1a1b41; margin-bottom: 15px;">🎯 Quick Check-in</h3>
              <p style="color: #666; margin-bottom: 15px;">Save this QR code for instant check-in at the event:</p>
              <div class="qr-code">
                <img src="${qrUrl}" alt="QR Check-in Code" style="width: 150px; height: 150px;">
              </div>
              <p style="color: #666; font-size: 14px;">Show this code at the entrance for quick access!</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; color: #1a1b41; margin-bottom: 15px;">Can't wait to see you there! 🎉</p>
              <p style="color: #666;">Questions? Just reply to this email!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};