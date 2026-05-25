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
  "";

const resultsContainer =
  document.getElementById(
    "resultsContainer"
  );

const saveResultsBtn =
  document.getElementById(
    "saveResultsBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const adminBtn =
  document.getElementById(
    "adminBtn"
  );

adminBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "admin.html";

  }
);

const generateNextPhaseBtn =
  document.getElementById(
    "generateNextPhaseBtn"
  );

let matches = [];

const phases = [

  {
    id: "round32",
    name: "1/16 de Final"
  },

  {
    id: "round16",
    name: "Oitavas de Final"
  },

  {
    id: "quarterfinals",
    name: "Quartas de Final"
  },

  {
    id: "semifinals",
    name: "Semifinais"
  },

  {
    id: "thirdplace",
    name: "3º Lugar"
  },

  {
    id: "final",
    name: "Final"
  }

];

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

    setTimeout(() => {

      window.location.href =
        "dashboard.html";

    }, 1800);

    return;

  }

  await loadMatches();

});

logoutBtn.addEventListener(
  "click",
  async () => {

    await signOut(auth);

    window.location.href =
      "index.html";

  }
);

async function loadMatches() {

  resultsContainer.innerHTML = "";

  for (const phase of phases) {

    const matchesRef = doc(
      db,
      "knockoutMatches",
      phase.id
    );

    const matchesSnap =
      await getDoc(matchesRef);

    if (!matchesSnap.exists()) {

      continue;

    }

    const phaseMatches =
      matchesSnap.data().matches;

    renderPhase(
      phase,
      phaseMatches
    );

  }

}

function renderPhase(
  phase,
  phaseMatches
) {

  resultsContainer.innerHTML += `

    <div class="phase-title">

      ${phase.name}

    </div>

  `;

  phaseMatches.forEach(match => {

    resultsContainer.innerHTML += `

      <div class="knockout-card">

        <h2>
          Jogo ${match.matchNumber}
        </h2>

        <div class="score-row">

          <span>
            ${match.homeName}
          </span>

          <input
            type="number"
            min="0"
            id="${phase.id}_home_${match.matchNumber}"
            value="${match.homeScore ?? ""}"
          >

          <span>x</span>

          <input
            type="number"
            min="0"
            id="${phase.id}_away_${match.matchNumber}"
            value="${match.awayScore ?? ""}"
          >

          <span>
            ${match.awayName}
          </span>

        </div>

        <div
          id="${phase.id}_winnerContainer_${match.matchNumber}"
          class="winner-container"
          style="
            display:
            ${
              match.homeScore === match.awayScore &&
              match.homeScore !== null
                ? "block"
                : "none"
            };
          "
        >

          <p>
            ${
              phase.id === "final" ||
              phase.id === "thirdplace"
                ? "Quem venceu?"
                : "Quem avançou?"
            }
          </p>

          <select
            id="${phase.id}_winner_${match.matchNumber}"
          >

            <option value="">
              Selecionar
            </option>

            <option
              value="${match.homeTeam}"
              ${
                match.winner === match.homeTeam
                  ? "selected"
                  : ""
              }
            >
              ${match.homeName}
            </option>

            <option
              value="${match.awayTeam}"
              ${
                match.winner === match.awayTeam
                  ? "selected"
                  : ""
              }
            >
              ${match.awayName}
            </option>

          </select>

        </div>

      </div>

    `;

  });

  setupDrawValidation(
    phase.id,
    phaseMatches
  );

}

function setupDrawValidation(
  phaseId,
  phaseMatches
) {

  phaseMatches.forEach(match => {

    const homeInput =
      document.getElementById(
        `${phaseId}_home_${match.matchNumber}`
      );

    const awayInput =
      document.getElementById(
        `${phaseId}_away_${match.matchNumber}`
      );

    const winnerContainer =
      document.getElementById(
        `${phaseId}_winnerContainer_${match.matchNumber}`
      );

    function validateDraw() {

      const home =
        Number(homeInput.value);

      const away =
        Number(awayInput.value);

      if (
        homeInput.value !== "" &&
        awayInput.value !== "" &&
        home === away
      ) {

        winnerContainer.style.display =
          "block";

      }

      else {

        winnerContainer.style.display =
          "none";

      }

    }

    homeInput.addEventListener(
      "input",
      validateDraw
    );

    awayInput.addEventListener(
      "input",
      validateDraw
    );

  });

}

saveResultsBtn.addEventListener(
  "click",
  async () => {

    try {

      for (const phase of phases) {

        const matchesRef = doc(
          db,
          "knockoutMatches",
          phase.id
        );

        const matchesSnap =
          await getDoc(matchesRef);

        if (!matchesSnap.exists()) {

          continue;

        }

        const phaseMatches =
          matchesSnap.data().matches;

        const results = [];

        for (const match of phaseMatches) {

          const homeScore =
            document.getElementById(
              `${phase.id}_home_${match.matchNumber}`
            ).value;

          const awayScore =
            document.getElementById(
              `${phase.id}_away_${match.matchNumber}`
            ).value;

          if (
            homeScore === "" ||
            awayScore === ""
          ) {

            continue;

          }

          const winnerSelect =
            document.getElementById(
              `${phase.id}_winner_${match.matchNumber}`
            );

          let finalWinner = null;

          if (
            Number(homeScore) >
            Number(awayScore)
          ) {

            finalWinner =
              match.homeTeam;

          }

          else if (
            Number(awayScore) >
            Number(homeScore)
          ) {

            finalWinner =
              match.awayTeam;

          }

          else {

            finalWinner =
              winnerSelect.value;

          }

          results.push({

            ...match,

            homeScore:
              Number(homeScore),

            awayScore:
              Number(awayScore),

            winner:
              finalWinner

          });

        }

        await setDoc(
          doc(
            db,
            "officialKnockoutResults",
            phase.id
          ),
          {
            matches: results,
            updatedAt:
              new Date()
          }
        );

        await setDoc(
          doc(
            db,
            "knockoutMatches",
            phase.id
          ),
          {
            matches: results,
            updatedAt: new Date()
          }
        );

      }

      saveResultsBtn.innerText =
        "Resultados Salvos!";

      showToast(
        "Resultados salvos com sucesso!",
        "success"
      );

      setTimeout(() => {

        saveResultsBtn.innerText =
          "Salvar Resultados";

      }, 3000);

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao salvar resultados.",
        "error"
      );

    }

  }
);

generateNextPhaseBtn.addEventListener(
  "click",
  async () => {

    try {

      const phaseOrder = [

        "round32",
        "round16",
        "quarterfinals",
        "semifinals"

      ];

      const nextPhaseMap = {

        round32:
          "round16",

        round16:
          "quarterfinals",

        quarterfinals:
          "semifinals",

        semifinals:
          "final"

      };

      let currentPhase = null;

      for (const phase of phaseOrder) {

        const officialRef = doc(
          db,
          "officialKnockoutResults",
          phase
        );

        const officialSnap =
          await getDoc(officialRef);

        if (officialSnap.exists()) {

          const matches =
            officialSnap.data().matches;

          const completed =
            matches.every(
              match => match.winner
            );

          if (completed) {

            currentPhase = phase;

          }

        }

      }

      if (!currentPhase) {

        showToast(
          "Nenhuma fase concluída.",
          "warning"
        );

        return;

      }

      const nextPhase =
        nextPhaseMap[currentPhase];

      if (!nextPhase) {

        showToast(
          "Não existe próxima fase.",
          "warning"
        );

        return;

      }

      const officialRef = doc(
        db,
        "officialKnockoutResults",
        currentPhase
      );

      const officialSnap =
        await getDoc(officialRef);

      const officialMatches =
        officialSnap.data().matches;

      const winners =
        officialMatches.map(
          match => {

            if (
              match.winner ===
              match.homeTeam
            ) {

              return {

                teamId:
                  match.homeTeam,

                name:
                  match.homeName,

                shortName:
                  match.homeShortName,

                flag:
                  match.homeFlag

              };

            }

            return {

              teamId:
                match.awayTeam,

              name:
                match.awayName,

              shortName:
                match.awayShortName,

              flag:
                match.awayFlag

            };

          }
        );

      const nextMatches = [];

let matchNumber = 1;

if (
  currentPhase === "semifinals"
) {

  const losers = [];

  officialMatches.forEach(match => {

    if (
      match.winner ===
      match.homeTeam
    ) {

      losers.push({

        teamId:
          match.awayTeam,

        name:
          match.awayName,

        shortName:
          match.awayShortName,

        flag:
          match.awayFlag

      });

    }

    else {

      losers.push({

        teamId:
          match.homeTeam,

        name:
          match.homeName,

        shortName:
          match.homeShortName,

        flag:
          match.homeFlag

      });

    }

  });

  const finalMatch = [

    {

      phase: "final",

      matchNumber: 1,

      homeTeam:
        winners[0].teamId,

      awayTeam:
        winners[1].teamId,

      homeName:
        winners[0].name,

      awayName:
        winners[1].name,

      homeShortName:
        winners[0].shortName,
      
      awayShortName:
        winners[1].shortName,

      homeFlag:
        winners[0].flag,

      awayFlag:
        winners[1].flag,

      winner: null,

      homeScore: null,

      awayScore: null

    }

  ];

  await setDoc(

    doc(
      db,
      "knockoutMatches",
      "final"
    ),

    {
      matches:
        finalMatch,

      updatedAt:
        new Date()
    }

  );

  const thirdPlaceMatch = [

    {

      phase: "thirdplace",

      matchNumber: 1,

      homeTeam:
        losers[0].teamId,

      awayTeam:
        losers[1].teamId,

      homeName:
        losers[0].name,

      awayName:
        losers[1].name,

      homeShortName:
        losers[0].shortName,

      awayShortName:
        losers[1].shortName,
      
      homeFlag:
        losers[0].flag,

      awayFlag:
        losers[1].flag,

      winner: null,

      homeScore: null,

      awayScore: null

    }

  ];

  await setDoc(

    doc(
      db,
      "knockoutMatches",
      "thirdplace"
    ),

    {
      matches:
        thirdPlaceMatch,

      updatedAt:
        new Date()
    }

  );

}

else {

  for (
    let i = 0;
    i < winners.length;
    i += 2
  ) {

    nextMatches.push({

      phase: nextPhase,

      matchNumber,

      homeTeam:
        winners[i].teamId,

      awayTeam:
        winners[i + 1].teamId,

      homeName:
        winners[i].name,

      awayName:
        winners[i + 1].name,

      homeShortName:
        winners[i].shortName,

      awayShortName:
        winners[i+1].shortName,

      homeFlag:
        winners[i].flag,

      awayFlag:
        winners[i+1].flag,

      winner: null,

      homeScore: null,

      awayScore: null

    });

    matchNumber++;

  }

  await setDoc(

    doc(
      db,
      "knockoutMatches",
      nextPhase
    ),

    {
      matches:
        nextMatches,

      updatedAt:
        new Date()
    }

  );

} 

      showToast(
        "Próxima fase gerada com sucesso!",
        "success"
      );

      await loadMatches();

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao gerar próxima fase.",
        "error"
      );

    }

  }
);
