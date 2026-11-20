# WealthTrack Safe Android Test (v0.2)
This is a minimal Android WebView wrapper for the existing WealthTrack authenticated web app.
It requests only INTERNET permission. It does NOT read payment notifications, SMS, accessibility content, contact data, or financial information from other apps.
Login and transactions are handled by the HTTPS WealthTrack website and its existing Supabase auth/database.
WebView navigation is restricted to https://wealthtrack-two.vercel.app. External HTTPS links open in the phone's browser.
Run the GitHub Actions workflow WealthTrack Android APK to get the debug APK. This is not a Play Protect certification; installation on any particular device cannot be guaranteed.
To test: sign in, add a ₹10 transaction, refresh, and check the balance on another device.
UPI auto detection is NOT included.
