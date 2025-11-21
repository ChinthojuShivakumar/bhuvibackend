import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email provider
  auth: {
    user: "mymobile1208@gmail.com", // Your email
    pass: "hdga aeke litf pqbw", // Use an App Password for security
  },
});

export const sendTestEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: '"EMS" mymobile1208@gmail.com',
      to: email,
      subject: "Your Login OTP",
      text: `Your OTP for login is ${otp}. It is valid for 5 minutes.`,
      html: `<p>Your OTP for login is <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
    });

    console.log("OTP sent: " + info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};
