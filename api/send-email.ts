import { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Validate request body
    const { to, subject, html } = req.body;

    // Check for required fields
    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format'
      });
    }

    // Check if API key is available
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return res.status(500).json({
        success: false,
        error: 'Email service configuration error'
      });
    }

    // Send email using Resend
    const emailFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const data = await resend.emails.send({
      from: emailFrom,
      to: [to], // Ensure to is an array
      subject,
      html,
    });

    console.log('Email sent successfully:', data);

    return res.status(200).json({ 
      success: true, 
      data: {
        id: data.data?.id || 'unknown',
        message: 'Email sent successfully'
      }
    });

  } catch (error: any) {
    console.error('Email sending failed:', error);
    
    // Handle different types of errors
    if (error.name === 'validation_error') {
      return res.status(400).json({
        success: false,
        error: 'Email validation failed: ' + error.message
      });
    }
    
    if (error.name === 'api_key_invalid') {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key configuration'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to send email: ' + error.message
    });
  }
}