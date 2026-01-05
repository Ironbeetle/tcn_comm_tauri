import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

if (!process.env.RESEND_FROM_EMAIL || !process.env.RESEND_FROM_NAME) {
  throw new Error('Missing RESEND_FROM_EMAIL or RESEND_FROM_NAME environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
