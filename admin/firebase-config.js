const firebaseConfig = {
  apiKey: "AIzaSyDDypVMEXqEDj0g5KK755b_9X-rTHMr3IY",
  authDomain: "belleru-6a39f.firebaseapp.com",
  projectId: "belleru-6a39f",
  storageBucket: "belleru-6a39f.firebasestorage.app",
  messagingSenderId: "593568579201",
  appId: "1:593568579201:web:93b6a8b6009b9db1449780",
  measurementId: "G-N5BZ5GW0TY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();