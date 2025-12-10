# Firestore Security Rules

## ⚠️ IMPORTANT: Update Your Firestore Security Rules

Your app is getting "Missing or insufficient permissions" errors. You need to update your Firestore security rules.

### Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **finbot-a7d8e**
3. Go to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages collection - users can only read/write their own messages
    match /messages/{messageId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    
    // Chats collection - users can only read/write their own chats
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

5. Click **Publish** to save the rules

### Also Create the Required Indexes:

1. In Firebase Console, go to **Firestore Database** → **Indexes** tab
2. Click the link in the console error message, OR manually create these indexes:

**For messages collection:**
- Collection: `messages`
- Fields: 
  - `uid` (Ascending)
  - `chatId` (Ascending)  
  - `timestamp` (Ascending)

**For chats collection:**
- Collection: `chats`
- Fields:
  - `uid` (Ascending)
  - `createdAt` (Descending)

After creating the indexes, wait a few minutes for them to build, then refresh your app.











