import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3001;

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors({
  origin: 'http://localhost:5173' // Your Vite app's URL
}));
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    const data = await resend.emails.send({
      from: 'PartyHaus <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Email server running at http://localhost:${port}`);
});
