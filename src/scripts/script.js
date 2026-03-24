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

// Gerenciador global de widgets para facilitar escalabilidade futura.
window.KaizenWidgets = window.KaizenWidgets || {
  registry: {},
  register(id, group = "ambient") {
    this.registry[id] = group;
  },
  setVisible(id, visible) {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.toggle("widget-hidden", !visible);
  },
  setGroupVisible(group, visible) {
    Object.entries(this.registry).forEach(([id, currentGroup]) => {
      if (currentGroup === group) {
        this.setVisible(id, visible);
      }
    });
  }
};

// ==========================================
// 3S: WIDGET COMBO (RELOGIO + CLIMA)
// ==========================================
let clockIntervalId = null;

function getWeatherIconSvg(code, color) {
  if (code >= 51 && code <= 99) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>`;
  }

  if (code >= 1 && code <= 3) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
}

function getLocationOffIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle><line x1="4" y1="4" x2="20" y2="20"></line></svg>`;
}

function createTimeWeatherWidget() {
  let widget = document.getElementById("widget-tempo-clima");

  if (!widget) {
    widget = document.createElement("div");
    widget.id = "widget-tempo-clima";
    widget.className = "widget-tempo-clima";
    widget.innerHTML = `
      <div class="widget-clock" id="widgetClock" title="Hora local">--:--</div>
      <div class="widget-weather" id="widgetWeather">
        <span class="weather-inline-icon" aria-hidden="true">${getLocationOffIconSvg()}</span>
        <button class="btn-weather-activate" type="button" id="btnWeatherActivate">Ativar Clima</button>
      </div>
    `;
    document.body.appendChild(widget);
  }

  window.KaizenWidgets.register("widget-tempo-clima", "ambient");

  const activateButton = document.getElementById("btnWeatherActivate");
  if (activateButton) {
    activateButton.addEventListener("click", requestWeatherPermission);
  }

  startLocalClock();
  checkWeatherPermission();
}

function updateClockDisplay() {
  const clockNode = document.getElementById("widgetClock");
  if (!clockNode) return;

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  clockNode.textContent = `${hh}:${mm}`;
}

function startLocalClock() {
  updateClockDisplay();

  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }

  clockIntervalId = setInterval(updateClockDisplay, 60000);
}

function renderWeatherPendingOrDeniedState() {
  const weatherNode = document.getElementById("widgetWeather");
  if (!weatherNode) return;

  weatherNode.innerHTML = `
    <span class="weather-inline-icon" aria-hidden="true">${getLocationOffIconSvg()}</span>
    <button class="btn-weather-activate" type="button" id="btnWeatherActivate">Ativar Clima</button>
  `;

  const activateButton = document.getElementById("btnWeatherActivate");
  if (activateButton) {
    activateButton.addEventListener("click", requestWeatherPermission);
  }
}

function renderWeatherValue(temp, code, title, showLocationWarning) {
  const weatherNode = document.getElementById("widgetWeather");
  if (!weatherNode) return;

  const icon = getWeatherIconSvg(code, "var(--neon-cyan)");
  const warningIcon = showLocationWarning
    ? `<span class="weather-inline-icon" aria-hidden="true">${getLocationOffIconSvg()}</span>`
    : "";

  weatherNode.innerHTML = `
    ${warningIcon}
    <span class="weather-inline-icon" aria-hidden="true">${icon}</span>
    <span class="weather-temp" title="${title}">${temp}°C</span>
    ${showLocationWarning ? '<button class="btn-weather-activate" type="button" id="btnWeatherActivate">Ativar Clima</button>' : ""}
  `;

  if (showLocationWarning) {
    const activateButton = document.getElementById("btnWeatherActivate");
    if (activateButton) {
      activateButton.addEventListener("click", requestWeatherPermission);
    }
  }
}

async function fetchWeather(lat, lon, isFallback = false) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Falha ao consultar clima");
    }

    const data = await response.json();
    const temp = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;

    if (isFallback) {
      renderWeatherValue(temp, code, "Local padrão: São Paulo (fallback).", true);
    } else {
      renderWeatherValue(temp, code, "Clima atual da sua localização.", false);
    }
  } catch (error) {
    if (!isFallback) {
      fetchWeather(-23.55, -46.63, true);
      return;
    }

    renderWeatherPendingOrDeniedState();
  }
}

function checkWeatherPermission() {
  renderWeatherPendingOrDeniedState();

  if (!("geolocation" in navigator)) {
    fetchWeather(-23.55, -46.63, true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeather(position.coords.latitude, position.coords.longitude, false);
    },
    () => {
      fetchWeather(-23.55, -46.63, true);
    },
    { timeout: 6000 }
  );
}

function requestWeatherPermission() {
  if (!("geolocation" in navigator)) {
    fetchWeather(-23.55, -46.63, true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      fetchWeather(position.coords.latitude, position.coords.longitude, false);
    },
    () => {
      fetchWeather(-23.55, -46.63, true);
    },
    { timeout: 6000 }
  );
}

window.requestWeatherPermission = requestWeatherPermission;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createTimeWeatherWidget);
} else {
  createTimeWeatherWidget();
}
