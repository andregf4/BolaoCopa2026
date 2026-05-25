export function showToast(
  message,
  type = "success"
) {

  const toastContainer =
    document.getElementById(
      "toast"
    );

  const toast =
    document.createElement("div");

  toast.classList.add(
    "toast",
    `toast-${type}`
  );

  let icon =
    "fa-solid fa-circle-check";

  if (type === "error") {

    icon =
      "fa-solid fa-circle-xmark";

  }

  if (type === "warning") {

    icon =
      "fa-solid fa-triangle-exclamation";

  }

  toast.innerHTML = `

    <i class="${icon}"></i>

    <span>${message}</span>

  `;

  toastContainer.appendChild(
    toast
  );

  setTimeout(() => {

    toast.classList.add(
      "toast-hide"
    );

    setTimeout(() => {

      toast.remove();

    }, 350);

  }, 3000);

}