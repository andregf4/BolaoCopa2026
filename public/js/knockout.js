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

const matchesContainer =
  document.getElementById(
    "matchesContainer"
  );

const saveKnockoutBtn =
  document.getElementById(
    "saveKnockoutBtn"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const dashboardBtn =
  document.getElementById(
    "dashboardBtn"
  );

let matches = [];

let html = "";

let lockedPhases = {};

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

  const settingsRef = doc(
    db,
    "settings",
    "system"
  );

  const settingsSnap =
    await getDoc(settingsRef);

  if (settingsSnap.exists()) {

    lockedPhases =
      settingsSnap.data()
        .lockedKnockoutPhases || {};

  }

  await loadMatches(user);

});

logoutBtn.addEventListener(
  "click",
  async () => {

    await signOut(auth);

    window.location.href =
      "index.html";

  }
);

dashboardBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "dashboard.html";

  }
);

async function loadMatches(user) {

  html = "";

  matches = [];

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
      matchesSnap.data().matches.map(
        match => ({
          ...match,
          phase: phase.id
        })
      );

    matches.push(...phaseMatches);

    await renderPhase(
      user,
      phase,
      phaseMatches
    );
  }

  matchesContainer.innerHTML = html;

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

    setupDrawValidation(
      phase.id,
      phaseMatches
    );

  }
  setupAccordion();
}

async function renderPhase(
  user,
  phase,
  phaseMatches
) {

  html += `

  <div class="phase-accordion">

    <button
      class="phase-toggle"
      data-phase="${phase.id}"
    >

      <span>
        ${phase.name}
      </span>

      <span
        id="icon_${phase.id}"
      >
        +
      </span>

    </button>

    <div
      class="phase-content"
      id="content_${phase.id}"
    >

`;

  const predictionRef = doc(
    db,
    "knockoutPredictions",
    user.uid
  );

  const predictionSnap =
    await getDoc(predictionRef);

  const phaseLocked =
    lockedPhases[phase.id] || false;

  let savedPredictions = [];

  if (predictionSnap.exists()) {

    savedPredictions =
      predictionSnap.data()[phase.id] || [];

  }

  phaseMatches.forEach(match => {

    const saved =
      savedPredictions.find(
        p => p.matchNumber === match.matchNumber
      );

    html += `

      <div class="knockout-card">

        <h2>
          Jogo ${match.matchNumber}
        </h2>

        <div class="score-row">

          <span class="team-label">
            <span class="fi fi-${match.homeFlag}"></span>
            ${match.homeShortName}
          </span>

          <input
            type="number"
              inputmode="numeric"
              pattern="[0-9]*"
            min="0"
            max="99"
            ${phaseLocked ? "disabled" : ""}
            id="${phase.id}_home_${match.matchNumber}"
            value="${saved?.homeScore ?? ""}"
          >

          <span>x</span>

          <input
            type="number"
              inputmode="numeric"
              pattern="[0-9]*"
            min="0"
            max="99"
            ${phaseLocked ? "disabled" : ""}
            id="${phase.id}_away_${match.matchNumber}"
            value="${saved?.awayScore ?? ""}"
          >

          <span class="team-label">
            ${match.awayShortName}
            <span class="fi fi-${match.awayFlag}"></span>
          </span>
          

        </div>

        <div
          id="${phase.id}_winnerContainer_${match.matchNumber}"
          class="winner-container"
          style="
            display:
            ${
              saved &&
              saved.homeScore !== null &&
              saved.awayScore !== null &&
              Number(saved.homeScore) === Number(saved.awayScore)
                ? "block"
                : "none"
            };
          "
        >

          <p>
            ${
              phase.id === "final" ||
              phase.id === "thirdplace"
                ? "Quem vencerá?"
                : "Quem avançará?"
            }
          </p>

          <select
            ${phaseLocked ? "disabled" : ""}
            id="${phase.id}_winner_${match.matchNumber}"
          >

            <option value="">
              Selecionar
            </option>

            <option
              value="${match.homeTeam}"
              ${
                saved?.winner === match.homeTeam
                  ? "selected"
                  : ""
              }
            >
              ${match.homeName}
            </option>

            <option
              value="${match.awayTeam}"
              ${
                saved?.winner === match.awayTeam
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

  html += `

    </div>

  </div>

`;

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

    if (
      !homeInput ||
      !awayInput ||
      !winnerContainer
    ) {

      return;

    }

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

    validateDraw();

  });

}

function setupAccordion() {

  const toggles =
    document.querySelectorAll(
      ".phase-toggle"
    );

  toggles.forEach(toggle => {

    toggle.addEventListener(
      "click",
      () => {

        const phaseId =
          toggle.dataset.phase;

        const content =
          document.getElementById(
            `content_${phaseId}`
          );

        const icon =
          document.getElementById(
            `icon_${phaseId}`
          );

        const opened =
          content.classList.contains(
            "open"
          );

        if (opened) {

          content.classList.remove(
            "open"
          );

          icon.innerText = "+";

        }

        else {

          content.classList.add(
            "open"
          );

          icon.innerText = "−";

        }

      }
    );

  });

}

saveKnockoutBtn.addEventListener(
  "click",
  async () => {

    const user = auth.currentUser;

    if (!user) {

      return;

    }

    try {

      const predictions = [];

      for (const match of matches) {

        if (lockedPhases[match.phase]) {

          continue;

        }

        const homeScore =
          document.getElementById(
            `${match.phase}_home_${match.matchNumber}`
          ).value;

        const awayScore =
          document.getElementById(
            `${match.phase}_away_${match.matchNumber}`
          ).value;

        const winner =
          document.getElementById(
            `${match.phase}_winner_${match.matchNumber}`
          ).value;

        if (
          homeScore === "" ||
          awayScore === ""
        ) {

          showToast(
            `Preencha o jogo ${match.matchNumber}`,
            "warning"
          );

          return;

        }

        if (
          Number(homeScore) ===
          Number(awayScore) &&
          !winner
        ) {

          showToast(
            `${
              match.phase === "final" ||
              match.phase === "thirdplace"
                ? "Escolha quem vencerá"
                : "Escolha quem avançará"
            } no jogo ${match.matchNumber}`,
            "warning"
          );

          return;

        }

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

        finalWinner = winner;

        }

        predictions.push({

        phase:
            match.phase,

        matchNumber:
            match.matchNumber,

        homeScore:
            Number(homeScore),

        awayScore:
            Number(awayScore),

        winner:
            finalWinner

        });

      }

      const groupedPredictions = {};

      predictions.forEach(prediction => {

        if (!groupedPredictions[prediction.phase]) {

          groupedPredictions[prediction.phase] = [];

        }

        groupedPredictions[
          prediction.phase
        ].push(prediction);

      });

      await setDoc(

        doc(
          db,
          "knockoutPredictions",
          user.uid
        ),

        groupedPredictions,

        {
          merge: true
        }

      );

      saveKnockoutBtn.innerText =
        "Palpites Salvos!";

      showToast(
        "Palpites salvos com sucesso!",
        "success"
      );

      setTimeout(() => {

        saveKnockoutBtn.innerText =
          "Salvar Palpites";

      }, 3000);

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao salvar palpites.",
        "error"
      );

    }

  }
);