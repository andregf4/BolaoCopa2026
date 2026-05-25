import { auth, db } from "./firebase.js";

import { showToast }
from "./toast.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const provider =
  new GoogleAuthProvider();

const loginBtn =
  document.getElementById("loginBtn");

loginBtn.addEventListener(
  "click",
  async () => {

    try {

      const result =
        await signInWithPopup(
          auth,
          provider
        );

      const user = result.user;

      await setDoc(

        doc(
          db,
          "users",
          user.uid
        ),

        {

          nome:
            user.displayName,

          email:
            user.email,

          foto:
            user.photoURL,

          updatedAt:
            new Date()

        },

        {
          merge: true
        }

      );

      window.location.href =
        "dashboard.html";

    }

    catch (error) {

      console.error(error);

      showToast(
        "Não foi possível fazer login.",
        "error"
      );

    }

  }
);