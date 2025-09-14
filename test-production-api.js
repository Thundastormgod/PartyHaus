// Test production email API
// Run with: node test-production-api.js

async function testProductionAPI() {
  console.log('🚀 Testing Production Email API...');
  
  const apiUrl = 'https://partyhaus-ahikn9li9-thundastormgods-projects.vercel.app/api/email';
  
  const emailData = {
    to: 'thecommodore30@gmail.com',
    subject: '🎉 Production Email Test - PartyHaus Live!',
    html: `
      <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
        <h1 style="color: #6C63FF;">🎉 PartyHaus Production Test</h1>
        <p>This email was sent from the LIVE production Vercel deployment!</p>
        <div style="background: linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h2 style="margin: 0;">✅ Email System Status: WORKING</h2>
          <p style="margin: 10px 0 0 0;">Your invite email feature is ready for production!</p>
        </div>
        <ul style="color: #666; line-height: 1.6;">
          <li>✅ Vercel serverless function deployed</li>
          <li>✅ Resend API integration working</li>
          <li>✅ Beautiful email templates ready</li>
          <li>✅ Error handling implemented</li>
          <li>✅ Toast notifications configured</li>
        </ul>
        <p>🎊 Ready to send party invitations!</p>
      </div>
    `,
  };
  
  try {
    console.log('📤 Sending request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Production email sent successfully!');
      console.log('📧 Result:', result);
      console.log('🎉 Your email invitation system is LIVE and working!');
    } else {
      console.error('❌ Production email failed:', result);
    }
    
  } catch (error) {
    console.error('❌ API request failed:', error.message);
  }
}

testProductionAPI();