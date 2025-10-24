/* ====================================
   FIREBASE CONFIGURATION
   ==================================== */

// TODO: Replace with your Firebase project configuration
// Get these values from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
    apiKey: "AIzaSyA8LOLGmz2srW0wsC8P7VjjYjNaqe4qGFw",
    authDomain: "catalysis-blog.firebaseapp.com",
    projectId: "catalysis-blog",
    storageBucket: "catalysis-blog.firebasestorage.app",
    messagingSenderId: "650112690481",
    appId: "1:650112690481:web:a3a923f734083e2b3d6810",
};

// Initialize Firebase
let db;
try {
    // Check if Firebase SDK is loaded
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
    } else {
        console.error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

// Export db for use in other scripts
window.firestoreDb = db;
