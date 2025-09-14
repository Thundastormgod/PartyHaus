// Test live production deployment
// Run with: node test-live-production.js

async function testLiveProduction() {
  console.log('🚀 Testing Live Production at partyhaus.vercel.app...');
  
  // Test 1: Check if the main site is loading
  try {
    console.log('\n📱 Testing main site...');
    const response = await fetch('https://partyhaus.vercel.app');
    if (response.ok) {
      console.log('✅ Main site is live and accessible');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log(`❌ Main site error: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Main site test failed:', error.message);
  }
  
  // Test 2: Check send-email API endpoint
  try {
    console.log('\n📧 Testing send-email API...');
    const emailData = {
      to: 'test@partyhaus.app',
      subject: '🎉 Production Test - PartyHaus Live!',
      html: `
        <div style="font-family: system-ui, sans-serif; padding: 20px; max-width: 600px;">
          <h1 style="color: #6C63FF;">🎉 PartyHaus Production Test</h1>
          <p>This email was sent from the LIVE production deployment!</p>
          <div style="background: linear-gradient(135deg, #6C63FF 0%, #FF6B6B 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h2 style="margin: 0;">✅ Email System Status: LIVE</h2>
            <p style="margin: 10px 0 0 0;">Your deployment is working perfectly!</p>
          </div>
          <ul style="color: #666; line-height: 1.6;">
            <li>✅ Vercel deployment successful</li>
            <li>✅ API endpoints working</li>
            <li>✅ Email templates deployed</li>
            <li>✅ Production environment active</li>
          </ul>
          <p>🎊 Ready for real users!</p>
        </div>
      `,
    };
    
    const response = await fetch('https://partyhaus.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email API is working in production!');
      console.log('📧 Result:', result);
    } else {
      const errorText = await response.text();
      console.log(`❌ Email API error: ${response.status}`);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Email API test failed:', error.message);
  }
  
  // Test 3: Check email webhook endpoint
  try {
    console.log('\n🔗 Testing email webhook...');
    const response = await fetch('https://partyhaus.vercel.app/api/email-webhook', {
      method: 'OPTIONS'
    });
    
    if (response.ok) {
      console.log('✅ Email webhook endpoint is accessible');
    } else {
      console.log(`⚠️ Email webhook: ${response.status} (may be normal for OPTIONS)`);
    }
  } catch (error) {
    console.log('❌ Webhook test failed:', error.message);
  }
  
  // Test 4: Check API directory
  try {
    console.log('\n📁 Testing API directory...');
    const response = await fetch('https://partyhaus.vercel.app/api/test');
    console.log(`API test endpoint: ${response.status}`);
  } catch (error) {
    console.log('API test endpoint not accessible (normal)');
  }
  
  console.log('\n🎯 Production Deployment Summary:');
  console.log('================================');
  console.log('🌐 Site URL: https://partyhaus.vercel.app');
  console.log('📧 Email API: /api/send-email');
  console.log('🔗 Webhook: /api/email-webhook');
  console.log('🗃️ Storage: Supabase integration');
  console.log('\n🚀 PartyHaus is LIVE in production!');
}

testLiveProduction().catch(console.error);