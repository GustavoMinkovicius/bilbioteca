import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBcaja_AP-WOBsumDXqoSIAKvpkzk9tcrg",
    authDomain: "bibliotecavirtual-48ca6.firebaseapp.com",
    projectId: "bibliotecavirtual-48ca6",
    storageBucket: "bibliotecavirtual-48ca6.appspot.com",
    messagingSenderId: "1099377922709",
    appId: "1:1099377922709:web:0be1f3e721876c4361c19c"
  };

    let app;

  if (firebase.apps.length === 0) {
    app = firebase.initializeApp(firebaseConfig)
  } else {
    app = firebase.app();
  }

  const db = app.firestore();

  export default db;
