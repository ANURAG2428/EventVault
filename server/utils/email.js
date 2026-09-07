const dotenv = require("dotenv");

dotenv.config();

// Render's free tier blocks outbound SMTP (ports 25/465/587), so nodemailer
// can never connect to Gmail from there. Brevo's HTTPS API (port 443) is not
// blocked, so we send email through that instead. Function signatures are
// unchanged, so no other file needs to change.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendViaBrevo = async ({ to, toName, subject, html }) => {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "Eventora", email: process.env.EMAIL_USER },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errBody}`);
  }
};

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
  try {
    await sendViaBrevo({
      to: userEmail,
      toName: userName,
      subject: `Booking Confirmed: ${eventTitle}`,
      html: `
        <h2>Hi ${userName}!</h2>
        <p>Your booking for the event <strong>${eventTitle}</strong> is successfully confirmed.</p>
        <p>Thank you for choosing Eventora.</p>
      `,
    });
    console.log("Email sent successfully to", userEmail);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendOTPEmail = async (userEmail, otp, type) => {
  try {
    const title =
      type === "account_verification"
        ? "Verify your Eventora Account"
        : "Eventora Booking Verification";
    const msg =
      type === "account_verification"
        ? "Please use the following OTP to verify your new Eventora account."
        : "Please use the following OTP to verify and confirm your event booking.";

    await sendViaBrevo({
      to: userEmail,
      subject: title,
      html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #111;">${title}</h2>
                    <p style="color: #555; font-size: 16px;">${msg}</p>
                    <div style="margin: 20px auto; padding: 15px; font-size: 24px; font-weight: bold; background: #f4f4f4; width: max-content; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                </div>
            `,
    });
    console.log(`OTP sent to ${userEmail} for ${type}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

module.exports = { sendBookingEmail, sendOTPEmail };
