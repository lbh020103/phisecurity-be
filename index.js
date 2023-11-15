const express = require('express')
const axios = require('axios');
const app = express()
const admin  = require("firebase-admin")
const credential = require("./creds.json")
const firebase = require('firebase/app');

admin.initializeApp({
    credential: admin.credential.cert(credential),
    databaseURL: 'https://flutterfire-e2e-tests-default-rtdb.europe-west1.firebasedatabase.app',
})

const db = admin.firestore();
const User = db.collection("AccountSuspended");
const firestore = admin.firestore();

app.use(express.json())

app.use(express.urlencoded({extended: true}))

app.get("/", async (req, res) => {
  const uid = req.query.uid;

  if (!uid) {
    return res.status(400).json({ error: 'User ID is missing' });
  }
  
  let collectionToUpdate;

  // Determine the collection based on the user ID
  if (uid.startsWith('AS')) {
    collectionToUpdate = 'AccountSuspended';
  } else if (uid.startsWith('PE')) {
    collectionToUpdate = 'PasswordExpiration';
  } else if (uid.startsWith('TG')) {
    collectionToUpdate = 'ThankGiving';
  } else {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

    try {
    // Find the document in the corresponding collection where 'data' field contains the user ID
    const querySnapshot = await db.collection(collectionToUpdate).where('uid', '==', uid).get();

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User ID not found' });
    }

    // Update the first matching document
    const userDoc = querySnapshot.docs[0];
    const userRef = admin.firestore().collection(collectionToUpdate).doc(userDoc.id);

    // Update the username in the user document
    await userRef.update({ clicked: "true" });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating Firestore:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 8080;
app.listen(port, () => console.log(`Server has started on port: ${port}`))