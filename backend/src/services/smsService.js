/**
 * Thin wrapper around whatever local SMS gateway you choose (e.g. Nexah,
 * a local telco SMPP gateway, or Twilio if it covers Cameroon for your
 * corridor). Swap the fetch call below for your provider's actual API -
 * the rest of the app only ever calls sendSms(), so the provider can
 * change without touching callers.
 */
async function sendSms(toPhone, message) {
  const url = process.env.SMS_GATEWAY_API_URL;
  const apiKey = process.env.SMS_GATEWAY_API_KEY;

  if (!url || !apiKey) {
    console.warn(`[sms] Gateway not configured - would have sent to ${toPhone}: "${message}"`);
    return { simulated: true };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      to: toPhone,
      sender: process.env.SMS_SENDER_ID || 'FlotteGuard',
      message
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SMS gateway error (${response.status}): ${text}`);
  }

  return response.json();
}

module.exports = { sendSms };
