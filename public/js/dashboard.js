import { auth, db } from "./firebase.js";

import { groups } from "./groupsData.js";

import { showToast }
from "./toast.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const userPhoto = document.getElementById("userPhoto");

const userName = document.getElementById("userName");

const userEmail = document.getElementById("userEmail");

const logoutBtn = document.getElementById("logoutBtn");

const knockoutBtn = document.getElementById("knockoutBtn");

const adminBtn = document.getElementById("adminBtn");

const ADMIN_EMAIL = "andrejuventude@gmail.com";

const groupsContainer = document.getElementById("groupsContainer");

const saveAllBtn = document.getElementById("saveAllBtn");

let groupsLocked = false;

onAuthStateChanged(auth, async (user) => {

  if (user) {

    userPhoto.src = user.photoURL;

    userName.innerText = user.displayName;

    userEmail.innerText = user.email;

    const settingsRef = doc(
      db,
      "settings",
      "system"
    );

    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {

      const settingsData = settingsSnap.data();

      groupsLocked = settingsData.groupsLocked || false;

    }

    if (user.email === ADMIN_EMAIL) {

      adminBtn.style.display = "block";

    }

    await renderGroups(user);

  } else {

    window.location.href = "index.html";

  }

  console.log("AUTH FUNCIONANDO");

  console.log(user);

});

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

  window.location.href = "index.html";

});

adminBtn.addEventListener("click", () => {

  window.location.href = "admin.html";

});

knockoutBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "knockout.html";

  }
);

async function renderGroups(user) {

  if (groupsLocked) {

    saveAllBtn.style.display = "none";

    const warning = document.createElement("div");

    warning.classList.add("locked-warning");

    warning.innerText = "Palpites da fase de grupos estão bloqueados.";

    groupsContainer.before(warning);

  }

  groupsContainer.innerHTML = "";

  for (const group of groups) {

    const card = document.createElement("div");

    card.classList.add("group-card");

    card.innerHTML = `

      <h2>Grupo ${group.letter}</h2>

      <table class="group-table">

        <thead>

          <tr>
            <th>Seleção</th>
            <th>1º</th>
            <th>2º</th>
            <th>3º</th>
            <th>4º</th>
          </tr>

        </thead>

        <tbody>

          ${group.teams.map(team => `

            <tr>

              <td class="team-name">
                <span class="fi fi-${team.flag}"></span>
                ${team.name}
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_1"
                  value="${team.id}"
                  ${groupsLocked ? "disabled" : ""}
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_2"
                  value="${team.id}"
                  ${groupsLocked ? "disabled" : ""}
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_3"
                  value="${team.id}"
                  ${groupsLocked ? "disabled" : ""}
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_4"
                  value="${team.id}"
                  ${groupsLocked ? "disabled" : ""}
                >
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

    groupsContainer.appendChild(card);

    const predictionRef = doc(
      db,
      "groupPredictions",
      `${user.uid}_${group.letter}`
    );

    const predictionSnap = await getDoc(predictionRef);

    if (predictionSnap.exists()) {

      const data = predictionSnap.data();

      data.ranking.forEach((teamId, index) => {

        const position = index + 1;

        const radio = card.querySelector(
          `input[name="${group.letter}_${position}"][value="${teamId}"]`
        );

        if (radio) {

          radio.checked = true;

        }

      });

    }

    const radios = card.querySelectorAll('input[type="radio"]');

    radios.forEach(radio => {

      radio.addEventListener("change", () => {

        const selectedTeam = radio.value;

        const currentRadio = radio;

        radios.forEach(otherRadio => {

          if (
            otherRadio.value === selectedTeam &&
            otherRadio !== currentRadio
          ) {

            otherRadio.checked = false;

          }

        });

      });

    });

  }

}

saveAllBtn.addEventListener("click", async () => {

  const user = auth.currentUser;

  try {

    for (const group of groups) {

      const selectedTeams = [];

      for (let position = 1; position <= 4; position++) {

        const selected = document.querySelector(
          `input[name="${group.letter}_${position}"]:checked`
        );

        if (!selected) {

          showToast(
            `Preencha todas as posições do grupo ${group.letter}.`,
            "warning"
          );

          return;

        }

        selectedTeams.push(selected.value);

      }

      const uniqueTeams = new Set(selectedTeams);

      if (uniqueTeams.size !== 4) {

        showToast(
          `Uma seleção está repetida no grupo ${group.letter}.`,
          "error"
        );

        return;

      }

      await setDoc(
        doc(db, "groupPredictions", `${user.uid}_${group.letter}`),
        {
          uid: user.uid,
          group: group.letter,
          ranking: selectedTeams,
          updatedAt: new Date()
        }
      );

    }

    /*
    saveAllBtn.innerText = "Palpites Salvos!";

    setTimeout(() => {

      saveAllBtn.innerText = "Salvar Todos os Palpites";

    }, 3000);
    */

    saveAllBtn.disabled = true;

    // depois do sucesso:
    showToast("Palpites salvos com sucesso!", "success");

    saveAllBtn.disabled = false;

  } catch (error) {

    console.error(error);

    showToast("Erro ao salvar palpites.", "error");

  }

});