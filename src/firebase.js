import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC58-DtsvAoKD2cq8ciKM11LISJnM6383g",
  authDomain: "thien-an-pie.firebaseapp.com",
  projectId: "thien-an-pie",
  storageBucket: "thien-an-pie.firebasestorage.app",
  messagingSenderId: "331893044633",
  appId: "1:331893044633:web:ef4a4a6d798222b4bf0f08",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
