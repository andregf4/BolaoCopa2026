import { auth, db } from "./firebase.js";

import { showToast }
from "./toast.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL = "andrejuventude@gmail.com";

const groupsLocked = document.getElementById("groupsLocked");

const saveSettingsBtn = document.getElementById("saveSettingsBtn");

const resetSystemBtn = document.getElementById("resetSystemBtn");

console.log(resetSystemBtn);

const logoutBtn = document.getElementById("logoutBtn");

const backAdminBtn = document.getElementById("backAdminBtn");

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "index.html";

    return;

  }

  if (user.email !== ADMIN_EMAIL) {

    window.location.href =
      "dashboard.html";

    return;

  }

  await loadSettings();

});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

    window.location.href = "index.html";

  });
}

if (backAdminBtn) {

  backAdminBtn.addEventListener("click", () => {

    window.location.href = "admin.html";

  });
}

async function loadSettings() {

  const settingsRef = doc(
  db,
  "settings",
  "system"
);

const settingsSnap =
  await getDoc(settingsRef);

if (settingsSnap.exists()) {

  const settings =
    settingsSnap.data();

  groupsLocked.checked =
    settings.groupsLocked || false;

  const lockedPhases =
    settings.lockedKnockoutPhases || {};

  document.getElementById(
    "lock_round32"
  ).checked =
    lockedPhases.round32 || false;

  document.getElementById(
    "lock_round16"
  ).checked =
    lockedPhases.round16 || false;

  document.getElementById(
    "lock_quarterfinals"
  ).checked =
    lockedPhases.quarterfinals || false;

  document.getElementById(
    "lock_semifinals"
  ).checked =
    lockedPhases.semifinals || false;

  document.getElementById(
    "lock_thirdplace"
  ).checked =
    lockedPhases.thirdplace || false;

  document.getElementById(
    "lock_final"
  ).checked =
    lockedPhases.final || false;

}

}

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {

    try {

      await setDoc(
        doc(db, "settings", "system"),
        {
          groupsLocked:
            groupsLocked.checked,

          lockedKnockoutPhases: {

            round32:
              document.getElementById(
                "lock_round32"
              ).checked,

            round16:
              document.getElementById(
                "lock_round16"
              ).checked,

            quarterfinals:
              document.getElementById(
                "lock_quarterfinals"
              ).checked,

            semifinals:
              document.getElementById(
                "lock_semifinals"
              ).checked,

            thirdplace:
              document.getElementById(
                "lock_thirdplace"
              ).checked,

            final:
              document.getElementById(
                "lock_final"
              ).checked

          },

          updatedAt: new Date()
        }
      );

      saveSettingsBtn.innerText =
        "Configurações Salvas!";
      
      showToast(
        "Configurações salvas com sucesso!",
        "success"
      );

      setTimeout(() => {

        saveSettingsBtn.innerText =
          "Salvar Configurações";

      }, 3000);

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao salvar configurações.",
        "error"
      );

    }

  });
}

if (resetSystemBtn) {
  resetSystemBtn.addEventListener(
    "click",
    async () => {

      console.log("RESET CLICADO");

      resetSystemBtn.innerText =
        "Resetando...";

      resetSystemBtn.disabled = true;

      const confirmReset = window.confirm(
        "Tem certeza que deseja apagar TODOS os dados do bolão?"
      );

      if (!confirmReset) {

        resetSystemBtn.innerText =
          "Resetar Sistema";

        resetSystemBtn.disabled = false;

        return;

      }

      try {

        const collectionsToReset = [

          "groupPredictions",
          "officialGroups",
          "qualifiedTeams",
          "knockoutMatches",
          "rankings"

        ];

        for (const collectionName of collectionsToReset) {

          console.log(
            "Apagando coleção:",
            collectionName
          );

          const snapshot = await getDocs(
            collection(db, collectionName)
          );

          console.log(
            "Docs encontrados:",
            snapshot.docs.length
          );

          for (const documentItem of snapshot.docs) {

            console.log(
              "Apagando:",
              documentItem.id
            );

            await deleteDoc(documentItem.ref);

          }

        }

        showToast(
          "Sistema resetado com sucesso!",
          "success"
        );

      } catch (error) {

        console.error(error);

        showToast(
          "Erro ao resetar sistema.",
          "error"
        );

      }

      resetSystemBtn.innerText =
        "Resetar Sistema";

      resetSystemBtn.disabled = false;

    }
  );
}