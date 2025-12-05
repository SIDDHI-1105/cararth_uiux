# Google Sign-In Setup Guide

This guide will help you set up Google OAuth authentication for local development.

## Quick Setup

### 1. Paste the Google Client Secret

Open the `.env` file and replace `<PASTE_GOOGLE_CLIENT_SECRET_HERE>` with your actual Google Client Secret from the OAuth credentials JSON file.

```bash
GOOGLE_CLIENT_SECRET=your_actual_secret_here
```

### 2. Add Test Users (if in Testing Mode)

If your OAuth Consent Screen is in "Testing" mode:

1. Go to [Google Cloud Console - OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Scroll to "Test users" section
3. Click "Add Users"
4. Add your Google account email address

### 3. Restart the Development Server

```bash
npm run dev
```

### 4. Test the Sign-In Flow

1. Open http://localhost:5000 in your browser
2. Navigate to the login page or click "Sign In"
3. Click the "Continue with Google" button
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to http://localhost:5000

## Verification Steps

### Check Server Logs

When you start the server, you should see:
```
✅ Google OAuth configured with Client ID: 171917412099-536lcplf...
```

### Test the OAuth Flow

1. Navigate to: http://localhost:5000/auth/google
2. Server logs should show:
   ```
   🔐 Initiating Google OAuth flow...
   ```
3. After Google redirects back:
   ```
   🔄 Google OAuth callback received, processing...
   ✅ Google OAuth callback received for user: your@email.com
   ✅ Google sign-in successful, redirecting to home
   ```

### Verify User Session

After signing in, test the `/api/me` endpoint:
```bash
curl http://localhost:5000/api/me
```

Expected response:
```json
{
  "id": "user-id",
  "email": "your@email.com",
  "firstName": "Your",
  "lastName": "Name",
  "name": "Your Name",
  "profileImageUrl": "https://...",
  "isAuthenticated": true
}
```

## Troubleshooting

### "redirect_uri_mismatch" Error

If you see this error, the redirect URI in Google Console doesn't match your app:

1. Go to [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", add:
   ```
   http://localhost:5000/auth/google/callback
   ```
4. Save and try again

### "Missing GOOGLE_CLIENT_SECRET" Error

If you navigate to `/auth/google` and see an error page:

1. Check that `.env` file has the actual secret (not the placeholder)
2. Restart the dev server after updating `.env`
3. The secret should NOT have angle brackets: `<` or `>`

### Session Not Persisting

If you sign in but aren't staying logged in:

1. Check that `SESSION_SECRET` is set in `.env`
2. Clear browser cookies for localhost
3. Restart the dev server

## Production Deployment

Before deploying to production:

1. Update `GOOGLE_REDIRECT_URI` to your production domain:
   ```
   GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
   ```

2. Add the production redirect URI to Google Console

3. Set `cookie.secure = true` in session config (already configured to auto-detect production)

4. Publish your OAuth Consent Screen (move from Testing to Production mode)

## Need Help?

- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **OAuth 2.0 Documentation**: https://developers.google.com/identity/protocols/oauth2
- **Passport.js Docs**: http://www.passportjs.org/docs/
