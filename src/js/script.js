export function initHubControls(openBtnSel, hubSel, closeBtnSel) {
  const openBtn = document.querySelector(openBtnSel);
  const hub = document.querySelector(hubSel);
  const closeBtn = document.querySelector(closeBtnSel);

  function openHub() {
    hub.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    hub.focus();
  }
  function closeHub() {
    hub.hidden = true;
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", openHub);
  closeBtn.addEventListener("click", closeHub);
  document.addEventListener("keydown", (e) => {
    if (!hub.hidden && e.key === "Escape") closeHub();
  });
}