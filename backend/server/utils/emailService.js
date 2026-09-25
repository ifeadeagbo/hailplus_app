const nodemailer = require('nodemailer');
const logger = require('./logger');

// Escapes user-supplied text (names, addresses) before it goes into email HTML
const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOrderConfirmation = async (email, order) => {
  const mailOptions = {
    from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
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
            <img src="https://via.placeholder.com/150x50/ffffff/667eea?text=E-Commerce" alt="E-Commerce Store" class="logo">
            <h1>Thank You For Your Order!</h1>
          </div>
          
          <div class="content">
            <p>Hi ${escapeHtml(order.shippingAddress?.firstName || 'Valued Customer')},</p>
            <p>We've received your order and will begin processing it soon.</p>
            
            <div class="order-details">
              <h2>Order #${order.id.substring(0, 8).toUpperCase()}</h2>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> ${parseFloat(order.totalAmount).toFixed(2)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              
              <h3>Order Items:</h3>
              ${order.items.map(item => `
                <div class="item-row">
                  <strong>${escapeHtml(item.name)}</strong><br>
                  Quantity: ${item.quantity} | Price: ${parseFloat(item.price).toFixed(2)}
                </div>
              `).join('')}
              
              <h3>Shipping Address:</h3>
              <p>
                ${escapeHtml(order.shippingAddress.firstName)} ${escapeHtml(order.shippingAddress.lastName)}<br>
                ${escapeHtml(order.shippingAddress.address)}<br>
                ${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.zipCode)}
              </p>
            </div>
            
            <center>
              <a href="${process.env.CLIENT_URL}/orders" class="button">Track Your Order</a>
            </center>
            
            <div class="footer">
              <p>If you have any questions, please contact us at <a href="mailto:support@ecommerce.com">support@ecommerce.com</a></p>
              <p>Follow us on:
                <a href="https://facebook.com">Facebook</a> |
                <a href="https://twitter.com">Twitter</a> |
                <a href="https://instagram.com">Instagram</a>
              </p>
              <p>&copy; 2024 E-Commerce Store. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Order confirmation email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

exports.sendPasswordReset = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
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
            <p>We received a request to reset the password for your E-Commerce Store account.</p>
            
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
            
            <p>Best regards,<br>The E-Commerce Store Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent');
  } catch (error) {
    logger.error('Error sending email', error);
  }
};

exports.sendRefundConfirmation = async (email, order, amount) => {
  const mailOptions = {
    from: `"E-Commerce Store" <${process.env.EMAIL_USER}>`,
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
              <p><strong>Refund Amount:</strong> ${amount.toFixed(2)}</p>
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
    await transporter.sendMail(mailOptions);
    logger.info('Refund confirmation email sent', { orderId: order.id });
  } catch (error) {
    logger.error('Error sending email', error);
  }
};