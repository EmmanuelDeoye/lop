// js/firebase-config.js
// Initialize Firebase with your configuration
// IMPORTANT: Replace this with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA5B3Okppo0Mw5c7Jp_lIaz_aMNZQpsTtA",
    authDomain: "lop-songs.firebaseapp.com",
    projectId: "lop-songs",
    storageBucket: "lop-songs.firebasestorage.app",
    messagingSenderId: "791236790779",
    appId: "1:791236790779:web:bd604ec799b2bf2192e35e",
    measurementId: "G-HKWTVCPC02"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database(); // Realtime Database instance

// Enable persistence for better offline experience
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);