// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyC5x6PWhnQc7U9hdpK6EzWr56YUjg93E",
  authDomain: "myparkingapp-327b1.firebaseapp.com",
  projectId: "myparkingapp-327b1",
  storageBucket: "myparkingapp-327b1.appspot.com",
  messagingSenderId: "41545212089",
  appId: "1:41545212089:web:2eA9afb5b8233948bbf6b8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);