import { auth, db } from "./firebase.js";

import { groups } from "./groupsData.js";

import { showToast } from "./toast.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL = "andrejuventude@gmail.com";

const qualifiedContainer =
  document.getElementById("qualifiedContainer");

const thirdPlaceContainer =
  document.getElementById("thirdPlaceContainer");

const saveQualifiedBtn =
  document.getElementById("saveQualifiedBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

const backAdminBtn =
  document.getElementById("backAdminBtn");

let qualifiedTeams = [];

let thirdPlacedTeams = [];

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "index.html";

    return;

  }

  if (user.email !== ADMIN_EMAIL) {

    showToast("Acesso negado.", "error");

    window.location.href = "dashboard.html";

    return;

  }

  await loadQualifiedTeams();

});

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

  window.location.href = "index.html";

});

backAdminBtn.addEventListener("click", () => {

  window.location.href = "admin.html";

});

async function loadQualifiedTeams() {

  qualifiedTeams = [];

  thirdPlacedTeams = [];

  qualifiedContainer.innerHTML = "";

  thirdPlaceContainer.innerHTML = "";

  for (const group of groups) {

    const officialRef = doc(
      db,
      "officialGroups",
      group.letter
    );

    const officialSnap =
      await getDoc(officialRef);

    if (!officialSnap.exists()) {

      continue;

    }

    const data = officialSnap.data();

    const firstTeam =
      group.teams.find(
        t => t.id === data.ranking[0]
      );

    console.log(firstTeam);

    const secondTeam =
      group.teams.find(
        t => t.id === data.ranking[1]
      );

    const thirdTeam =
      group.teams.find(
        t => t.id === data.ranking[2]
      );

    qualifiedTeams.push({
      teamId: firstTeam.id,
      name: firstTeam.name,
      shortName: firstTeam.shortName,
      flag: firstTeam.flag,
      group: group.letter,
      position: 1
    });

    qualifiedTeams.push({
      teamId: secondTeam.id,
      name: secondTeam.name,
      shortName: secondTeam.shortName,
      flag: secondTeam.flag,
      group: group.letter,
      position: 2
    });

    thirdPlacedTeams.push({
      teamId: thirdTeam.id,
      name: thirdTeam.name,
      shortName: thirdTeam.shortName,
      flag: thirdTeam.flag,
      group: group.letter,
      position: 3
    });

  }

  renderQualifiedTeams();

  renderThirdPlacedTeams();

}

function renderQualifiedTeams() {

  qualifiedContainer.innerHTML = `

    <div class="qualified-grid">

      ${qualifiedTeams.map(team => `

        <div class="qualified-card">

          <h3>${team.name}</h3>

          <p>
            Grupo ${team.group}
          </p>

          <p>
            ${team.position}º colocado
          </p>

        </div>

      `).join("")}

    </div>

  `;

}

function renderThirdPlacedTeams() {

  thirdPlaceContainer.innerHTML = `

    <div class="third-grid">

      ${thirdPlacedTeams.map(team => `

        <label class="third-card">

          <input
            type="checkbox"
            value="${team.teamId}"
          >

          <div>

            <h3>${team.name}</h3>

            <p>
              Grupo ${team.group}
            </p>

          </div>

        </label>

      `).join("")}

    </div>

  `;

}

saveQualifiedBtn.addEventListener("click", async () => {

  const selectedThirds =
    document.querySelectorAll(
      '#thirdPlaceContainer input:checked'
    );

  if (selectedThirds.length !== 8) {

    showToast(
      "Selecione exatamente 8 terceiros colocados.",
      "error"
    );

    return;

  }

  try {

    const finalQualified = [...qualifiedTeams];

    selectedThirds.forEach(input => {

      const team =
        thirdPlacedTeams.find(
          t => t.teamId === input.value
        );

      finalQualified.push({
        ...team,
        manuallyApproved: true
      });

    });

    await setDoc(
      doc(db, "qualifiedTeams", "teams"),
      {
        teams: finalQualified,
        updatedAt: new Date()
      }
    );

    showToast(
      "Classificados salvos com sucesso!",
      "success"
    );

    saveQualifiedBtn.innerText =
      "Classificados Salvos!";

    setTimeout(() => {

      saveQualifiedBtn.innerText =
        "Salvar Classificados";

    }, 3000);

  } catch (error) {

    console.error(error);

    showToast(
      "Erro ao salvar classificados.",
      "error"
    );

  }

});