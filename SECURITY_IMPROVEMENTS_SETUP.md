# Security Improvements - Setup Guide

## 🚀 What's New

Your Qnario project now has these security enhancements:

✅ **Rate Limiting** - Prevents brute force attacks
✅ **Password Reset** - Forgot password functionality with email
✅ **httpOnly Cookies** - Secure token storage
✅ **Enhanced Validation** - Better input checking
✅ **Improved Admin Features** - Better user management

---

## 📦 Step 1: Install Required Dependencies

Run this command in the qnario folder:

```bash
npm install express-rate-limit nodemailer cookie-parser
```

This installs:
- `express-rate-limit` - Rate limiting middleware
- `nodemailer` - Email sending service
- `cookie-parser` - Parse httpOnly cookies

---

## ⚙️ Step 2: Update Your .env File

Add these lines to your `.env` file:

```env
# Email Configuration (for password reset)
# If using Gmail, get app password from: https://myaccount.google.com/apppasswords
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

---

## 🔄 Step 3: Update server.js

The new enhanced auth routes are in `routes/auth-enhanced.js`

You need to change this line in `server.js`:

```javascript
// OLD:
app.use('/api/auth', require('./routes/auth'));

// NEW:
app.use('/api/auth', require('./routes/auth-enhanced'));
```

Also add these middleware to server.js (after `app.use(express.json())`):

```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());
```

---

## 📧 Step 4: Set Up Email (Gmail Example)

To enable password reset emails:

1. Go to: https://myaccount.google.com/apppasswords
2. Create an "App Password" for Node.js
3. Copy the password to your `.env` as `EMAIL_PASSWORD`

**Alternative (if you don't want emails):**
- Password reset will still work, but emails won't be sent
- You'll just see a message about it

---

## 🧪 Step 5: Test the Features

After updating, restart your server:

```bash
npm start
```

### Test Password Reset:
1. Go to `http://localhost:3000/forgot-password.html`
2. Enter an email (must be registered)
3. Click "Send Reset Link"
4. If email is configured, you'll get a reset link
5. Click the link to go to reset page
6. Set new password

### Test Rate Limiting:
1. Try logging in with wrong password 5+ times
2. You'll see: "Too many login attempts"
3. Wait 15 minutes or restart server

---

## 📁 New Files Created

```
qnario/
├── routes/auth-enhanced.js       ← New enhanced auth routes
├── middleware/rateLimiter.js     ← Rate limiting
├── services/emailService.js      ← Email sending
├── forgot-password.html          ← Forgot password page
├── reset-password.html           ← Reset password page
└── .env                          ← Updated with email config
```

---

## 🔐 Security Features Explained

### Rate Limiting
- **Login**: Max 5 attempts per 15 minutes
- **Signup**: Max 3 accounts per hour
- **Password Reset**: Max 3 requests per hour

### Password Reset Flow
```
User clicks "Forgot Password"
    ↓
Enters email
    ↓
Server generates secure token
    ↓
Email sent with reset link
    ↓
User clicks link
    ↓
User sets new password
    ↓
Token expires in 1 hour
```

### httpOnly Cookies
- Tokens stored in httpOnly cookies (more secure)
- Can't be accessed by JavaScript
- Automatically sent with requests
- Protected against XSS attacks

---

## ⚠️ Important Notes

1. **Email Setup Optional**: System works without email, but password reset won't send emails
2. **Token Expiry**: Reset tokens expire after 1 hour
3. **Rate Limits**: Happen per IP address
4. **Password Minimum**: 6 characters minimum

---

## 🐛 Troubleshooting

### "Email not sent"
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- For Gmail, ensure you use App Password, not regular password

### "Rate limit hit immediately"
- If behind proxy, rate limiter may see all requests as same IP
- Solution: Add proxy trust to server.js:
  ```javascript
  app.set('trust proxy', 1);
  ```

### "Dependencies not found"
- Run: `npm install express-rate-limit nodemailer cookie-parser`
- Restart server

---

## ✅ After Setup

Your system now has:
1. ✅ Brute force protection
2. ✅ Password reset via email
3. ✅ Secure cookie-based tokens
4. ✅ Better error messages
5. ✅ Enhanced admin features
6. ✅ Last login tracking

---

## 📞 Quick Reference

| Feature | File | Command |
|---------|------|---------|
| Reset Password | `forgot-password.html` | User-facing page |
| Change Auth Routes | `server.js` | Change require path |
| Rate Limiting | `middleware/rateLimiter.js` | Adjust limits here |
| Email Config | `.env` | Add EMAIL_USER & EMAIL_PASSWORD |

---

**Everything is ready to go!** 🚀

If you run into issues, check:
1. Dependencies installed: `npm list`
2. .env has correct values
3. server.js using auth-enhanced.js
4. MongoDB is running
