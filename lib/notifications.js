export async function sendReceipt({ email, phone, message }) {
  const results = [];

  if (email && process.env.RESEND_API_KEY && process.env.NOTIFICATION_FROM_EMAIL) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFICATION_FROM_EMAIL, to: [email], subject: 'topmeup transaction receipt', text: message }),
    });
    results.push({ channel: 'email', sent: response.ok });
  }

  if (phone && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    const response = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/\D/g, ''), type: 'text', text: { body: message } }),
    });
    results.push({ channel: 'whatsapp', sent: response.ok });
  }

  return results;
}