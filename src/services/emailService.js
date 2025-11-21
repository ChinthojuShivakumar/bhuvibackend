const nodemailer = require("nodemailer");
const smtpConfig = require("../config/smtpConfig");

// Create a nodemailer transporter using the SMTP configuration
// console.log(smtpConfig)
const transporter = nodemailer.createTransport(smtpConfig);

const sendEmail = async (toEmail, message, subject, isHtml = false) => {
  try {
    var transporter = nodemailer.createTransport({
      service: "gmail", // Use your email provider
      auth: {
        user: "mymobile1208@gmail.com", // Your email
        pass: "hdga aeke litf pqbw", // Use an App Password for security
      },

      tls: {
        rejectUnauthorized: false, // <-- allows self-signed cert
      },
    });

    const mailOptions = {
      from: "mymobile1208@gmail.com", // Sender email address
      to: "shivakumarchinthoju@gmail.com", // Recipient email address
      subject, // Email subject
      // text: `Your verification OTP is: ${otp}`, // Plain text body
      // text: message, // Plain text body
      ...(isHtml ? { html: message } : { text: message }),
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending Email:", error);
    throw error;
  }
};

const sendEmailforsrtView = async (
  toEmail,
  message,
  subject,
  streetViewUr20m,
  streetViewUr50m,
  streetViewUrl100m,
  streetViewUrl200m
) => {
  try {
    console.log(streetViewUr20m);
    console.log("message=====", message);
    const mailOptions = {
      from: smtpConfig.senderEmail, // Sender email address
      to: toEmail, // Recipient email address
      subject,
      text: message, // Plain text body
      html: `
      <p>${message}</p>
      <img src=${streetViewUr20m} alt="20meters"/>
      <img src=${streetViewUr50m} alt="50meters"/>
      <img src=${streetViewUrl100m} alt="100meters"/>
       <img src=${streetViewUrl200m} alt="200meters"/>
      `,
      // Email subject
      // text: `Your verification OTP is: ${otp}`, // Plain text body

      attachment: [
        {
          filename: "20meters.png",
          path: streetViewUr20m,
          cid: "20meters",
        },
        {
          filename: "50meters.png",
          path: streetViewUr50m,
          cid: "50meters",
        },
        {
          filename: "100meters.png",
          path: streetViewUrl100m,
          cid: "100meters",
        },
        {
          filename: "200meters.png",
          path: streetViewUrl200m,
          cid: "200meters",
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending Email:", error);
    throw error;
  }
};

// Function to send email with verification OTP
const sendVerificationEmail = async (toEmail, message) => {
  try {
    // const mailOptions = {
    //   from: smtpConfig.senderEmail, // Sender email address
    //   to: toEmail, // Recipient email address
    //   subject: 'Email Verification OTP', // Email subject
    //   // text: `Your verification OTP is: ${otp}`, // Plain text body
    //   text: message, // Plain text body
    // };

    // // Send the email
    // await transporter.sendMail(mailOptions);

    await sendEmail(toEmail, message, "Verification OTP");

    console.log("Verification OTP email sent successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

module.exports = { sendEmail, sendVerificationEmail, sendEmailforsrtView };
