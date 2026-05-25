import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const loadBtn =
  document.getElementById("loadBtn");

const output =
  document.getElementById("output");

loadBtn.addEventListener(
  "click",
  async () => {

    try {

      const collections = [

        "groupPredictions",
        "knockoutMatches",
        "knockoutPredictions",
        "officialGroups",
        "officialKnockoutResults",
        "qualifiedTeams",
        "rankings",
        "settings",
        "users"

      ];

      const result = {};

      for (const colName of collections) {

        const snapshot =
          await getDocs(
            collection(db, colName)
          );

        result[colName] = [];

        snapshot.forEach(docSnap => {

          result[colName].push({

            id: docSnap.id,

            ...docSnap.data()

          });

        });

      }

      output.textContent =
        JSON.stringify(
          result,
          null,
          2
        );

    }

    catch (error) {

      console.error(error);

      output.textContent =
        error.message;

    }

  }
);