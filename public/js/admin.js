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
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ADMIN_EMAIL = "andrejuventude@gmail.com";

const scoring = {

  round32: {
    exact: 5,
    winner: 3
  },

  round16: {
    exact: 10,
    winner: 6
  },

  quarterfinals: {
    exact: 15,
    winner: 9
  },

  semifinals: {
    exact: 20,
    winner: 12
  },

  thirdplace: {
    exact: 25,
    winner: 15
  },

  final: {
    exact: 30,
    winner: 18
  }

};

const GROUP_STAGE_POINTS = 5;

const adminGroupsContainer = document.getElementById("adminGroupsContainer");

const saveOfficialBtn = document.getElementById("saveOfficialBtn");

const logoutBtn = document.getElementById("logoutBtn");

const qualifiedBtn = document.getElementById("qualifiedBtn");

const settingsBtn = document.getElementById("settingsBtn");

const dashboardBtn = document.getElementById("dashboardBtn");

const knockoutBtn = document.getElementById("knockoutBtn");

const resultsBtn = document.getElementById("resultsBtn");

const calculateRankingBtn = document.getElementById("calculateRankingBtn");

onAuthStateChanged(auth, async (user) => {

  console.log(user.email);
  console.log(ADMIN_EMAIL);

  if (!user) {

    window.location.href = "index.html";

    return;

  }

  if (user.email !== ADMIN_EMAIL) {

    showToast(
      "Acesso negado.",
      "error"
    );

    window.location.href = "dashboard.html";

    return;

  }

  await renderOfficialGroups(user);

});

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

  window.location.href = "index.html";

});

qualifiedBtn.addEventListener("click", () => {

  window.location.href =
    "admin-qualified.html";

});

settingsBtn.addEventListener("click", () => {

  window.location.href =
    "admin-settings.html";

});

dashboardBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "dashboard.html";

  }
);

knockoutBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "admin-knockout.html";

  }
);

resultsBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "admin-results.html";

  }
);

calculateRankingBtn.addEventListener(
  "click",
  async () => {

    try {

      const predictionsSnap =
        await getDocs(
          collection(
            db,
            "groupPredictions"
          )
        );

      const rankingMap = {};

      for (const predictionDoc of predictionsSnap.docs) {

        const prediction =
          predictionDoc.data();

        const uid =
          prediction.uid;

        const group =
          prediction.group;

        const userRanking =
          prediction.ranking || [];

        if (!rankingMap[uid]) {

          rankingMap[uid] = {
            uid: uid,
            points: 0
          };

        }

        const officialGroupRef = doc(
          db,
          "officialGroups",
          group
        );

        const officialGroupSnap =
          await getDoc(
            officialGroupRef
          );

        if (!officialGroupSnap.exists()) {

          continue;

        }

        const officialRanking =
          officialGroupSnap.data().ranking || [];

        for (
          let i = 0;
          i < officialRanking.length;
          i++
        ) {

          if (
            officialRanking[i] ===
            userRanking[i]
          ) {

            rankingMap[uid].points +=
              GROUP_STAGE_POINTS;

          }

        }

      }

      const ranking = [];

      for (const uid in rankingMap) {

        const knockoutPredictionsRef = doc(
          db,
          "knockoutPredictions",
          uid
        );

        const knockoutPredictionsSnap =
          await getDoc(
            knockoutPredictionsRef
          );

        const userPredictions =
          knockoutPredictionsSnap.exists()
            ? knockoutPredictionsSnap.data()
            : {};

        let totalPoints =
          rankingMap[uid].points;

        for (const phase in scoring) {

          const officialRef = doc(
            db,
            "officialKnockoutResults",
            phase
          );

          const officialSnap =
            await getDoc(
              officialRef
            );

          if (!officialSnap.exists()) {

            continue;

          }

          const officialMatches =
            officialSnap.data().matches;

          const userMatches =
            userPredictions[phase] || [];

          officialMatches.forEach(
            officialMatch => {

              const userMatch =
                userMatches.find(
                  match =>
                    match.matchNumber ===
                    officialMatch.matchNumber
                );

              if (!userMatch) {

                return;

              }

              const exactHit =

                userMatch.homeScore ===
                  officialMatch.homeScore &&

                userMatch.awayScore ===
                  officialMatch.awayScore;

              if (exactHit) {

                totalPoints +=
                  scoring[phase].exact;

              }

              if (
                userMatch.winner ===
                officialMatch.winner
              ) {

                totalPoints +=
                  scoring[phase].winner;

              }

            }
          );

        }

        const userRef = doc(
          db,
          "users",
          uid
        );

        const userSnap =
          await getDoc(userRef);

        let userName =
          "Usuário";

        if (userSnap.exists()) {

          userName =
            userSnap.data().nome ||
            userSnap.data().email ||
            "Usuário";

        }

        ranking.push({

          uid: uid,

          name: userName,

          points: totalPoints

        });

      }

      ranking.sort(
        (a, b) =>
          b.points - a.points
      );

      await setDoc(

        doc(
          db,
          "rankings",
          "global"
        ),

        {

          users: ranking,

          updatedAt:
            new Date()

        }

      );

      showToast(
        "Ranking calculado com sucesso!",
        "success"
      );

    } catch (error) {

      console.error(error);

      showToast(
        "Erro ao calcular ranking.",
        "error"
      );

    }

  }
);

async function renderOfficialGroups(user) {

  adminGroupsContainer.innerHTML = "";

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
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_2"
                  value="${team.id}"
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_3"
                  value="${team.id}"
                >
              </td>

              <td>
                <input
                  type="radio"
                  name="${group.letter}_4"
                  value="${team.id}"
                >
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

    adminGroupsContainer.appendChild(card);

    const officialRef = doc(db,"officialGroups",group.letter);

    const officialSnap = await getDoc(officialRef);

    if (officialSnap.exists()) {

      const data = officialSnap.data();

      data.ranking.forEach((teamId, index) => {

        const position = index + 1;

        const radio = card.querySelector(`input[name="${group.letter}_${position}"][value="${teamId}"]`);

        if (radio) {

          radio.checked = true;

        }

      });

    }

    const radios = card.querySelectorAll('input[type="radio"]');

    radios.forEach(radio => {

      radio.addEventListener("change", () => {

        const selectedTeam = radio.value;

        radios.forEach(otherRadio => {

          if (
            otherRadio.value === selectedTeam &&
            otherRadio !== radio
          ) {

            otherRadio.checked = false;

          }

        });

      });

    });

  }

}

saveOfficialBtn.addEventListener("click", async () => {

  try {

    for (const group of groups) {

      const selectedTeams = [];

      for (let position = 1; position <= 4; position++) {

        const selected = document.querySelector(`input[name="${group.letter}_${position}"]:checked`);

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
          "warning"
        );

        return;

      }

      await setDoc(
        doc(db, "officialGroups", group.letter),
        {
          group: group.letter,
          ranking: selectedTeams,
          updatedAt: new Date()
        }
      );

    }

    saveOfficialBtn.innerText = "Resultados Salvos!";

    showToast(
      "Resultados oficiais salvos!",
      "success"
    );

    setTimeout(() => {

      saveOfficialBtn.innerText = "Salvar Resultados Oficiais";

    }, 3000);

  } catch (error) {

    console.error(error);

    showToast(
      "Erro ao salvar resultados.",
      "error"
    );

  }

});