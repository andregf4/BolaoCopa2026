import { auth, db }
from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
  doc,
  getDoc
} from
"https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const rankingBody =
  document.getElementById(
    "rankingBody"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

const dashboardBtn =
  document.getElementById(
    "dashboardBtn"
  );

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      window.location.href =
        "index.html";

      return;

    }

    await loadRanking();

  }
);

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

async function loadRanking() {

  const rankingRef = doc(
    db,
    "rankings",
    "global"
  );

  const rankingSnap =
    await getDoc(rankingRef);

  if (!rankingSnap.exists()) {

    rankingBody.innerHTML = `

      <tr>
        <td colspan="3">
          Ranking ainda não calculado.
        </td>
      </tr>

    `;

    return;

  }

  const ranking =
    rankingSnap.data().users;

  rankingBody.innerHTML = "";

  ranking.forEach(
    (user, index) => {

      rankingBody.innerHTML += `

        <tr class="${
          index === 0
            ? "top-player"
            : ""
        }">

          <td>
            #${index + 1}
          </td>

          <td>
            ${user.name}
          </td>

          <td>
            ${user.points}
          </td>

        </tr>

      `;

    }
  );

}