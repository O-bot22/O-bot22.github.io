// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, connectFirestoreEmulator, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore-lite.js";

const firebaseConfig = {
    apiKey: "AIzaSyAdZjIs5nGclyE2imP6i3IDMLSTZa5Ll6s",
    authDomain: "puerto-real-energy-poverty.firebaseapp.com",
    projectId: "puerto-real-energy-poverty",
    storageBucket: "puerto-real-energy-poverty.firebasestorage.app",
    messagingSenderId: "771763485796",
    appId: "1:771763485796:web:17a4dc2efc6231240ef371",
    measurementId: "G-8K571D71ED"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, connectFirestoreEmulator, query, where }; // Re-exporting for convenience
