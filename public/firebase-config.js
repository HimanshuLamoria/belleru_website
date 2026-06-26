// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
