const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const appShell = document.getElementById("appShell");

const state = {
  open: true,
  collapsed: false,
};

function isMobile() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function syncUi() {
  const mobile = isMobile();

  if (mobile) {
    state.collapsed = false;
  }

  sidebar.classList.toggle("is-pinned", !mobile);
  sidebar.classList.toggle("is-floating", mobile);
  sidebar.classList.toggle("is-open", state.open);
  sidebar.classList.toggle("is-collapsed", state.collapsed && !mobile);

  appShell.classList.toggle("is-sidebar-collapsed", state.collapsed && !mobile);
  appShell.classList.remove("is-sidebar-hidden");

  sidebarToggle.setAttribute("aria-expanded", String(mobile ? state.open : !state.collapsed));
}

sidebarToggle.addEventListener("click", () => {
  if (!isMobile()) {
    state.collapsed = !state.collapsed;
    state.open = true;
  } else {
    state.open = !state.open;
  }

  syncUi();
});

window.addEventListener("resize", () => {
  if (isMobile()) {
    state.open = false;
  } else {
    state.open = true;
  }

  syncUi();
});

syncUi();
