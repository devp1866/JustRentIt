import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

export const sendSMS = async (to, body) => {
    if (!client) {
        console.warn('Twilio credentials not found. Mocking SMS send.');
        console.log(`[MOCK SMS] To: ${to}, Body: ${body}`);
        return { success: true, sid: 'mock-sid' };
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromPhone,
            to
        });
        console.log(`SMS sent to ${to}. SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw new Error('Failed to send SMS');
    }
};
