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
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL =
  "andrejuventude@gmail.com";

const matchesContainer =
  document.getElementById(
    "matchesContainer"
  );

const saveMatchesBtn =
  document.getElementById(
    "saveMatchesBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const backAdminBtn =
  document.getElementById(
    "backAdminBtn"
  );

let qualifiedTeams = [];

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href =
      "index.html";

    return;

  }

  if (user.email !== ADMIN_EMAIL) {

    showToast(
      "Acesso negado.",
      "error"
    );

    window.location.href =
      "dashboard.html";

    return;

  }

  await loadQualifiedTeams();

});

logoutBtn.addEventListener(
  "click",
  async () => {

    await signOut(auth);

    window.location.href =
      "index.html";

  }
);

backAdminBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "admin.html";

  }
);

async function loadQualifiedTeams() {

  const qualifiedRef = doc(
    db,
    "qualifiedTeams",
    "teams"
  );

  const qualifiedSnap =
    await getDoc(qualifiedRef);

  if (!qualifiedSnap.exists()) {

    showToast(
      "Nenhum classificado encontrado.",
      "warning"
    );

    return;

  }

  qualifiedTeams =
    qualifiedSnap.data().teams;

  renderMatches();

}

function renderMatches() {

  matchesContainer.innerHTML = "";

  for (let i = 1; i <= 16; i++) {

    matchesContainer.innerHTML += `

      <div class="match-card">

        <h2>
          Jogo ${i}
        </h2>

        <select
          id="home_${i}"
        >

          <option value="">
            Seleção 1
          </option>

          ${qualifiedTeams.map(team => `

            <option value="${team.teamId}">
              ${team.name}
            </option>

          `).join("")}

        </select>

        <select
          id="away_${i}"
        >

          <option value="">
            Seleção 2
          </option>

          ${qualifiedTeams.map(team => `

            <option value="${team.teamId}">
              ${team.name}
            </option>

          `).join("")}

        </select>

      </div>

    `;

  }

}

saveMatchesBtn.addEventListener(
  "click",
  async () => {

    try {

      const matches = [];

      for (let i = 1; i <= 16; i++) {

        const homeTeam =
          document.getElementById(
            `home_${i}`
          ).value;

        const awayTeam =
          document.getElementById(
            `away_${i}`
          ).value;

        if (!homeTeam || !awayTeam) {

          showToast(
            `Preencha o jogo ${i}.`,
            "warning"
          );

          return;

        }

        if (homeTeam === awayTeam) {

          showToast(
            `Times repetidos no jogo ${i}.`,
            "warning"
          );

          return;

        }

        const home =
          qualifiedTeams.find(
            t => t.teamId === homeTeam
          );

        const away =
          qualifiedTeams.find(
            t => t.teamId === awayTeam
          );

        matches.push({

          phase: "round32",

          matchNumber: i,

          homeTeam: home.teamId,

          awayTeam: away.teamId,

          homeName: home.name,

          awayName: away.name,

          homeShortName: home.shortName || home.name,

          awayShortName: away.shortName || away.name,

          homeFlag: home.flag || "",

          awayFlag: away.flag || "",

          winner: null,

          homeScore: null,

          awayScore: null

        });

      }

      await setDoc(
        doc(
          db,
          "knockoutMatches",
          "round32"
        ),
        {
          matches,
          updatedAt: new Date()
        }
      );

      saveMatchesBtn.innerText =
        "Chaveamento Salvo!";

      showToast(
        "Chaveamento salvo com sucesso!",
        "success"
      );

      setTimeout(() => {

        saveMatchesBtn.innerText =
          "Salvar Chaveamento";

      }, 3000);

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao salvar chaveamento.",
        "error"
      );

    }

  }
);