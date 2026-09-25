import nodemailer from 'nodemailer'; // Import the entire nodemailer module

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT), // Ensure port is a number
  secure: process.env.EMAIL_PORT === '465', // Use secure: true for port 465, false for others (e.g., 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Optional: Add TLS settings for compatibility with some providers
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production', // Stricter in production
  },
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Transporter verification failed:', error);
  } else {
    console.log('Transporter is ready to send emails');
  }
});

export async function sendOrderConfirmation(email, order) {
  const mailOptions = {
    from: `"Your Store Name" <${process.env.EMAIL_USER}>`, // Add a sender name
    to: email,
    subject: `Order Confirmation #${order.id}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Your order #${order.id} has been confirmed.</p>
      <p><strong>Total Amount:</strong> $${(order.totalAmount / 100).toFixed(2)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <h2>Order Items:</h2>
      <ul>
        ${order.items
          .map(
            (item) => `
          <li>${item.name} - Quantity: ${item.quantity} - Price: $${(item.price / 100).toFixed(2)}</li>
        `
          )
          .join('')}
      </ul>
      <p>We'll send you another email when your order ships.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent:', info.response);
    return info; // Return response for further handling if needed
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error; // Propagate error to caller
  }
}

export async function sendPasswordReset(email, token) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Your Store Name" <${process.env.EMAIL_USER}>`, // Add a sender name
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.response);
    return info; // Return response for further handling if needed
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error; // Propagate error to caller
  }
}