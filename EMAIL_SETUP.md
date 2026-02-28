# Email Configuration Guide

## Setup Instructions for Order Confirmation Emails

### Option 1: Using Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password
   - Copy this password (remove spaces)

3. **Set Environment Variables**
   ```
   set MAIL_SERVER=smtp.gmail.com
   set MAIL_PORT=587
   set MAIL_USE_TLS=True
   set MAIL_USERNAME=your-email@gmail.com
   set MAIL_PASSWORD=xxxx xxxx xxxx xxxx
   set MAIL_DEFAULT_SENDER=noreply@jerseyshop.com
   ```

### Option 2: Using Other SMTP Providers

**Outlook.com:**
```
MAIL_SERVER=smtp.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

**SendGrid:**
```
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxx
```

### Option 3: Development Mode (Console Output)

To test without sending actual emails, use:
```
MAIL_DEBUG=1
MAIL_SUPPRESS_SEND=1
```

This will print emails to console instead of sending them.

## Testing the Email Functionality

1. Start the backend server
2. Place an order through the checkout process
3. Check the recipient email for the confirmation message
4. If using console mode, check the server output logs

## Features

- Beautiful HTML email template
- Order details with itemized breakdown
- Tax calculations displayed (15% jersey tax, 7% shipping tax)
- Professional formatting with gradient header
- Call-to-action button to view order
- Fallback handling if email fails (order still completes)
