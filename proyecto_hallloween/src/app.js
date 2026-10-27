import { categoryColors, categoryLabels, demoEvents } from "./data.js";

const SAVED_STORAGE_KEY = "nochecita:saved";

const elements = {
  eventList: document.querySelector("#event-list"),
  mapPanel: document.querySelector("#map-panel"),
  emptyState: document.querySelector("#empty-state"),
  summary: document.querySelector("#results-summary"),
  label: document.querySelector("#results-label"),
  search: document.querySelector("#search-input"),
  locality: document.querySelector("#locality-filter"),
  category: document.querySelector("#category-filter"),
  free: document.querySelector("#free-filter"),
  listButton: document.querySelector("#list-view-button"),
  mapButton: document.querySelector("#map-view-button"),
  clear: document.querySelector("#clear-filters"),
  savedNav: document.querySelector("#saved-nav"),
  savedCount: document.querySelector("#saved-count"),
  eventDialog: document.querySelector("#event-dialog"),
  suggestDialog: document.querySelector("#suggest-dialog"),
  suggestForm: document.querySelector("#suggest-form"),
  formFeedback: document.querySelector("#form-feedback"),
  toast: document.querySelector("#toast"),
};

let activeAudience = "all";
let savedOnly = false;
let currentEvents = [];
let currentView = "list";
let selectedEventId = null;
let map;
let markersLayer;
let toastTimeout;

const getStoredArray = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error(`No se pudo leer el almacenamiento local (${key}).`, error);
    return [];
  }
};

const savedIds = new Set(getStoredArray(SAVED_STORAGE_KEY));
let suggestedEvents = [];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function formatPrice(price) {
  if (price === 0) return "Gratis";
  if (price == null) return "Precio por confirmar";
  return `$${new Intl.NumberFormat("es-CO").format(price)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`)).replace(".", "");
}

function allEvents() {
  return [...suggestedEvents, ...demoEvents];
}

function populateLocalities() {
  const localities = [...new Set(allEvents().map((event) => event.locality))].sort((a, b) => a.localeCompare(b, "es"));
  for (const locality of localities) {
    const option = document.createElement("option");
    option.value = locality;
    option.textContent = locality;
    elements.locality.append(option);
  }
}

function getFilteredEvents() {
  const query = elements.search.value.trim().toLocaleLowerCase("es");
  return allEvents().filter((event) => {
    const matchesText = !query || [event.title, event.locality, event.place, event.categoryLabel]
      .some((value) => value.toLocaleLowerCase("es").includes(query));
    const matchesLocality = elements.locality.value === "all" || event.locality === elements.locality.value;
    const matchesCategory = elements.category.value === "all" || event.category === elements.category.value;
    const matchesAudience = activeAudience === "all" || event.audience === activeAudience;
    const matchesFree = !elements.free.checked || event.price === 0;
    const matchesSaved = !savedOnly || savedIds.has(event.id);
    return matchesText && matchesLocality && matchesCategory && matchesAudience && matchesFree && matchesSaved;
  });
}

function eventCard(event) {
  const saved = savedIds.has(event.id);
  const color = categoryColors[event.category] || "peach";
  const pending = event.sourceLabel?.includes("pendiente de revisión");
  return `
    <article class="event-card">
      <button class="event-card-main" type="button" data-open-event="${escapeHtml(event.id)}" aria-label="Ver detalles: ${escapeHtml(event.title)}">
        <span class="event-art ${color}" aria-hidden="true"><span>${escapeHtml(event.emoji || "✳")}</span></span>
        <span class="event-card-copy">
          <span class="event-card-meta">${escapeHtml(event.locality)} <span aria-hidden="true">·</span> ${escapeHtml(event.categoryLabel || categoryLabels[event.category] || "Comunidad")}${pending ? ' <span class="pending-label">· Pendiente</span>' : ""}</span>
          <span class="event-card-title">${escapeHtml(event.title)}</span>
          <span class="event-card-place"><span aria-hidden="true">⌖</span> ${escapeHtml(event.place)}</span>
          <span class="event-card-bottom"><span>${escapeHtml(formatShortDate(event.date))} <span aria-hidden="true">·</span> ${escapeHtml(event.time)}</span><strong class="${event.price === 0 ? "price-free" : ""}">${formatPrice(event.price)}</strong></span>
        </span>
      </button>
      <button class="save-button ${saved ? "is-saved" : ""}" type="button" data-save-event="${escapeHtml(event.id)}" aria-label="${saved ? "Quitar de" : "Guardar en"} favoritos" aria-pressed="${saved}">
        <span aria-hidden="true">${saved ? "♥" : "♡"}</span>
      </button>
    </article>`;
}

function updateResults() {
  currentEvents = getFilteredEvents();
  elements.eventList.innerHTML = currentEvents.map(eventCard).join("");
  elements.eventList.hidden = currentView !== "list" || currentEvents.length === 0;
  elements.mapPanel.hidden = currentView !== "map" || currentEvents.length === 0;
  elements.emptyState.hidden = currentEvents.length !== 0;
  elements.summary.textContent = `${currentEvents.length} ${currentEvents.length === 1 ? "plan" : "planes"} ${savedOnly ? "guardado" : "para descubrir"}`;
  elements.label.textContent = savedOnly ? "Tus planes guardados" : "Planes para descubrir";
  updateSavedCount();
  if (currentView === "map" && currentEvents.length) {
    drawMapMarkers();
  }
}

function updateSavedCount() {
  elements.savedCount.textContent = String(savedIds.size);
  elements.savedNav.classList.toggle("is-active", savedOnly);
  elements.savedNav.setAttribute("aria-pressed", String(savedOnly));
}

function persistSaved() {
  localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...savedIds]));
  updateSavedCount();
}

function toggleSaved(eventId) {
  if (savedIds.has(eventId)) {
    savedIds.delete(eventId);
    showToast("Plan quitado de guardados");
  } else {
    savedIds.add(eventId);
    showToast("Plan guardado para después");
  }
  persistSaved();
  updateResults();
  if (selectedEventId === eventId && elements.eventDialog.open) {
    updateDialogSaveButton();
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
}

function setView(view) {
  currentView = view;
  elements.listButton.classList.toggle("is-active", view === "list");
  elements.mapButton.classList.toggle("is-active", view === "map");
  elements.listButton.setAttribute("aria-pressed", String(view === "list"));
  elements.mapButton.setAttribute("aria-pressed", String(view === "map"));
  updateResults();
  if (view === "map" && map) {
    window.setTimeout(() => map.invalidateSize(), 50);
  }
}

function initializeMap() {
  if (!window.L || map) return;
  map = window.L.map("map", { scrollWheelZoom: false }).setView([4.6486, -74.08], 11);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  markersLayer = window.L.layerGroup().addTo(map);
}

function drawMapMarkers() {
  if (!window.L) {
    const mapContainer = document.querySelector("#map");
    mapContainer.innerHTML = '<div class="map-error">El mapa necesita conexión a internet para cargar. Puedes ver los planes en la vista Lista.</div>';
    return;
  }
  initializeMap();
  markersLayer.clearLayers();
  const bounds = [];
  currentEvents.forEach((event) => {
    if (!Array.isArray(event.coords)) return;
    const marker = window.L.marker(event.coords).addTo(markersLayer);
    marker.bindPopup(`<strong>${escapeHtml(event.title)}</strong><br>${escapeHtml(event.locality)} · ${escapeHtml(event.time)}`);
    marker.on("click", () => openEvent(event.id));
    bounds.push(event.coords);
  });
  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 13);
  }
}

function openEvent(eventId) {
  const event = allEvents().find((item) => item.id === eventId);
  if (!event) return;
  selectedEventId = eventId;
  const color = categoryColors[event.category] || "peach";
  const art = document.querySelector("#dialog-art");
  art.className = `dialog-art ${color}`;
  art.querySelector(".dialog-art-symbol").textContent = event.emoji || "✳";
  document.querySelector("#dialog-category").textContent = event.categoryLabel || categoryLabels[event.category] || "Comunidad";
  document.querySelector("#dialog-locality").textContent = `${event.locality} · BOGOTÁ`;
  document.querySelector("#dialog-title").textContent = event.title;
  document.querySelector("#dialog-description").textContent = event.description;
  document.querySelector("#dialog-when").textContent = `${formatDate(event.date)} · ${event.time}`;
  document.querySelector("#dialog-where").textContent = event.place;
  document.querySelector("#dialog-price").textContent = formatPrice(event.price);
  document.querySelector("#dialog-audience").textContent = event.audienceLabel || "Por confirmar";
  const source = document.querySelector("#dialog-source");
  source.replaceChildren();
  const sourceIcon = document.createElement("span");
  sourceIcon.setAttribute("aria-hidden", "true");
  sourceIcon.textContent = "ⓘ ";
  source.append(sourceIcon, document.createTextNode(`${event.sourceLabel || "Sugerencia comunitaria · pendiente de revisión"} · ${event.verifiedAt || "Pendiente de verificar"}`));
  if (event.sourceUrl) {
    try {
      const sourceUrl = new URL(event.sourceUrl);
      if (["http:", "https:"].includes(sourceUrl.protocol)) {
        const sourceLink = document.createElement("a");
        sourceLink.href = sourceUrl.href;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = " Ver fuente";
        source.append(sourceLink);
      }
    } catch (error) {
      console.error(`Enlace de fuente no válido para el evento ${event.id}.`, error);
    }
  }
  updateDialogSaveButton();
  elements.eventDialog.showModal();
}

function updateDialogSaveButton() {
  const button = document.querySelector("#dialog-save");
  const saved = savedIds.has(selectedEventId);
  button.textContent = saved ? "♥  Guardado" : "♡  Guardar este plan";
  button.setAttribute("aria-pressed", String(saved));
}

function resetFilters() {
  elements.search.value = "";
  elements.locality.value = "all";
  elements.category.value = "all";
  elements.free.checked = false;
  activeAudience = "all";
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const selected = chip.dataset.audience === "all";
    chip.classList.toggle("is-selected", selected);
    chip.setAttribute("aria-pressed", String(selected));
  });
  savedOnly = false;
  updateResults();
}

function openSuggestionDialog() {
  elements.formFeedback.hidden = true;
  elements.suggestDialog.showModal();
}

function syncSuggestionPriceField() {
  const isFree = elements.suggestForm.elements.free.checked;
  const priceField = document.querySelector("#suggest-price-field");
  priceField.hidden = isFree;
  priceField.querySelector("input").required = !isFree;
}

async function handleSuggestionSubmit(formEvent) {
  formEvent.preventDefault();
  const formData = new FormData(elements.suggestForm);
  const sourceUrl = String(formData.get("source")).trim();
  let validSource;
  try {
    validSource = new URL(sourceUrl);
  } catch {
    elements.formFeedback.textContent = "Escribe un enlace válido para que el equipo pueda revisar la fuente.";
    elements.formFeedback.hidden = false;
    return;
  }
  if (!["http:", "https:"].includes(validSource.protocol)) {
    elements.formFeedback.textContent = "El enlace de la fuente debe comenzar con http:// o https://.";
    elements.formFeedback.hidden = false;
    return;
  }
  const isFree = formData.get("free") === "on";
  const priceValue = Number(formData.get("price"));
  if (!isFree && (!Number.isFinite(priceValue) || priceValue < 0)) {
    elements.formFeedback.textContent = "Indica un costo válido o marca la opción «Es gratis».";
    elements.formFeedback.hidden = false;
    return;
  }
  const suggestionInput = {
    title: String(formData.get("title")).trim(),
    locality: String(formData.get("locality")),
    category: String(formData.get("category")),
    audience: String(formData.get("audience")),
    date: String(formData.get("date")),
    time: String(formData.get("time")),
    place: String(formData.get("place")).trim(),
    price: isFree ? 0 : priceValue,
    description: String(formData.get("description")).trim(),
    sourceUrl: validSource.href,
  };
  try {
    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(suggestionInput),
    });
    const result = await response.json();
    if (!response.ok) {
      const details = Array.isArray(result.details) ? ` ${result.details.join(" ")}` : "";
      throw new Error(`${result.error || "No se pudo guardar la sugerencia."}${details}`);
    }
    suggestedEvents.unshift(result.suggestion);
  } catch (error) {
    console.error("No se pudo enviar la sugerencia al backend.", error);
    elements.formFeedback.textContent = error instanceof TypeError
      ? "No se pudo conectar con el backend. Inícialo con «npm start» y abre la web desde http://localhost:3000."
      : error.message;
    elements.formFeedback.hidden = false;
    return;
  }
  const suggestion = suggestedEvents[0];
  if (suggestion.coords == null && !suggestion.status) {
    suggestion.status = "pending";
  }
  if (![...elements.locality.options].some((option) => option.value === suggestion.locality)) {
    const option = document.createElement("option");
    option.value = suggestion.locality;
    option.textContent = suggestion.locality;
    elements.locality.append(option);
  }
  elements.suggestForm.reset();
  syncSuggestionPriceField();
  elements.suggestDialog.close();
  savedOnly = false;
  updateResults();
  document.querySelector("#backend-status").textContent = "Conectado: sugerencia guardada en data/suggestions.json.";
  showToast("Guardado en el backend como pendiente de revisión");
}

elements.search.addEventListener("input", updateResults);
elements.locality.addEventListener("change", updateResults);
elements.category.addEventListener("change", updateResults);
elements.free.addEventListener("change", updateResults);
elements.clear.addEventListener("click", resetFilters);
document.querySelector("#empty-clear").addEventListener("click", resetFilters);
elements.listButton.addEventListener("click", () => setView("list"));
elements.mapButton.addEventListener("click", () => setView("map"));
elements.savedNav.addEventListener("click", () => {
  savedOnly = !savedOnly;
  updateResults();
  document.querySelector("#explorar").scrollIntoView({ behavior: "smooth" });
});
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    activeAudience = chip.dataset.audience;
    document.querySelectorAll(".filter-chip").forEach((item) => {
      const selected = item === chip;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    updateResults();
  });
});
elements.eventList.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-event]");
  if (saveButton) {
    toggleSaved(saveButton.dataset.saveEvent);
    return;
  }
  const eventButton = event.target.closest("[data-open-event]");
  if (eventButton) openEvent(eventButton.dataset.openEvent);
});
document.querySelector("#dialog-save").addEventListener("click", () => toggleSaved(selectedEventId));
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
document.querySelectorAll("#open-suggest, #sidebar-suggest, #community-suggest").forEach((button) => {
  button.addEventListener("click", openSuggestionDialog);
});
elements.suggestForm.elements.free.addEventListener("change", syncSuggestionPriceField);
elements.suggestForm.addEventListener("submit", handleSuggestionSubmit);
[elements.eventDialog, elements.suggestDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

async function initializeApp() {
  try {
    const response = await fetch("/api/suggestions");
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudieron cargar las sugerencias.");
    if (!Array.isArray(result.suggestions)) throw new Error("El backend devolvió un formato de sugerencias inesperado.");
    suggestedEvents = result.suggestions;
    document.querySelector("#backend-status").textContent = "Conectado: los planes se guardan en el archivo del proyecto.";
  } catch (error) {
    console.error("No se pudieron cargar sugerencias desde el backend.", error);
    document.querySelector("#backend-status").textContent = "Backend desconectado. Inicia el servidor con «npm start» para enviar sugerencias.";
  }
  populateLocalities();
  updateResults();
}

initializeApp();
