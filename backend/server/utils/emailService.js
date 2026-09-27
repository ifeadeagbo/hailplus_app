const nodemailer = require('nodemailer');
const logger = require('./logger');

const STORE_NAME = process.env.STORE_NAME || 'Our Store';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
// With Resend, mail comes from the store's own domain (EMAIL_FROM); customer
// replies go to the support inbox
const FROM = process.env.EMAIL_FROM || `"${STORE_NAME}" <${process.env.EMAIL_USER}>`;

// Escapes user-supplied text (names, addresses) before it goes into email HTML
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

// Every send* function catches its own errors, so callers can send without
// awaiting: a slow or unreachable mail server must never hold up a request.
// Timeouts keep a blocked SMTP port from tying up connections for minutes.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000
});

// Sends through Resend's HTTPS API when RESEND_API_KEY is set (works on
// hosts that block SMTP ports, such as Render's free plan), otherwise SMTP
const deliver = async (mailOptions) => {
  if (!process.env.RESEND_API_KEY) {
    return transporter.sendMail({ ...mailOptions, replyTo: SUPPORT_EMAIL });
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: mailOptions.from,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      reply_to: SUPPORT_EMAIL
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 200)}`);
  }
  return response.json();
};
exports.deliver = deliver;

exports.sendOrderConfirmation = async (email, order) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: `Order Confirmation #${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { width: 150px; margin-bottom: 20px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .item-row { border-bottom: 1px solid #eee; padding: 10px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p style="font-size: 20px; font-weight: bold; margin: 0 0 10px;">${escapeHtml(STORE_NAME)}</p>
            <h1>Thank You For Your Order!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${escapeHtml(order.shippingAddress?.firstName || 'Valued Customer')},</p>
            <p>We've received your order and will begin processing it soon.</p>
            
            <div class="order-details">
              <h2>Order #${order.id.substring(0, 8).toUpperCase()}</h2>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> £${parseFloat(order.totalAmount).toFixed(2)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              
              <h3>Order Items:</h3>
              ${order.items.map(item => `
                <div class="item-row">
                  <strong>${escapeHtml(item.name)}</strong><br>
                  Quantity: ${item.quantity} | Price: £${parseFloat(item.price).toFixed(2)}
                </div>
              `).join('')}
              
              <h3>Shipping Address:</h3>
              <p>
                ${escapeHtml(order.shippingAddress.firstName)} ${escapeHtml(order.shippingAddress.lastName)}<br>
                ${escapeHtml(order.shippingAddress.address)}<br>
                ${[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).map(escapeHtml).join(', ')}<br>
                ${escapeHtml(order.shippingAddress.zipCode)}
              </p>
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL}/orders" class="button">Track Your Order</a>
            </center>
            
            <div class="footer">
              <p>If you have any questions, please contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
              <p>&copy; ${new Date().getFullYear()} ${escapeHtml(STORE_NAME)}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await deliver(mailOptions);
    logger.info('Order confirmation email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

exports.sendPasswordReset = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your ${escapeHtml(STORE_NAME)} account.</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <div class="warning">
              <strong>Note:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            
            <p>Best regards,<br>The ${escapeHtml(STORE_NAME)} Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await deliver(mailOptions);
    logger.info('Password reset email sent');
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

exports.sendRefundConfirmation = async (email, order, amount) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: `Refund Processed - Order #${order.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .refund-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Refund Processed</h1>
          </div>
          
          <div class="content">
            <p>Hello,</p>
            <p>Your refund has been successfully processed.</p>
            
            <div class="refund-details">
              <h3>Refund Details</h3>
              <p><strong>Order Number:</strong> #${order.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Refund Amount:</strong> £${amount.toFixed(2)}</p>
              <p><strong>Processing Time:</strong> 5-10 business days</p>
            </div>
            
            <p>The refund will appear in your account within 5-10 business days, depending on your bank's processing time.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await deliver(mailOptions);
    logger.info('Refund confirmation email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

exports.sendShippingNotification = async (email, order) => {
  const mailOptions = {
    from: FROM,
    to: email,
    subject: `Your order #${order.id.substring(0, 8).toUpperCase()} has shipped`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your order is on its way!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${escapeHtml(order.shippingAddress?.firstName || 'there')},</p>
            <p>Good news: your order has shipped.</p>
            
            <div class="details">
              <p><strong>Order Number:</strong> #${order.id.substring(0, 8).toUpperCase()}</p>
              ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${escapeHtml(order.trackingNumber)}</p>` : ''}
              <h3>Items:</h3>
              ${order.items.map(item => `<p>${escapeHtml(item.name)} &times; ${item.quantity}</p>`).join('')}
              <h3>Shipping to:</h3>
              <p>
                ${escapeHtml(order.shippingAddress.address)}<br>
                ${[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).map(escapeHtml).join(', ')}<br>
                ${escapeHtml(order.shippingAddress.zipCode)}
              </p>
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL}/orders" class="button">View Your Orders</a>
            </center>
            
            <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await deliver(mailOptions);
    logger.info('Shipping notification sent', { orderId: order.id });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};
