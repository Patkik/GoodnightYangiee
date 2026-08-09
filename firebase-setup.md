# Firebase Integration Setup Guide — Hakdog Sanctuary

Firebase Cloud Firestore is now **active and configured** for your project (`hakdog-91862`).

---

## Active Configuration Details

Your Firebase Web App credentials are now active in `index.html`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyClcy7YWLnvH05hx4GBMoxab17QyUolnmI",
  authDomain: "hakdog-91862.firebaseapp.com",
  projectId: "hakdog-91862",
  storageBucket: "hakdog-91862.firebasestorage.app",
  messagingSenderId: "525522947265",
  appId: "1:525522947265:web:7d3b73972816b82c7fd840"
};
```

---

## Real-Time Sync Features Enabled

1. **Care Jar & Streak Sync**:
   - **Firestore Collection**: `care_jar`
   - **Document**: `yangiee_state`
   - When Yangiee or Patrick checks in, the streak count, star leaves count, and check-in date update automatically on all devices.

2. **Starlight Mailbox Sync**:
   - **Firestore Collection**: `mailbox_notes`
   - Every note written in the Mailbox is saved to Cloud Firestore and instantly broadcasts to both devices.
