const grid = document.getElementById("grid");
const searchInput = document.getElementById("search");
const subjectSel = document.getElementById("subject");
const gradeSel = document.getElementById("grade");
const typeSel = document.getElementById("type");
const sortSel = document.getElementById("sort");
const resetBtn = document.getElementById("reset");
const countEl = document.getElementById("count");
const activeFiltersEl = document.getElementById("activeFilters");

const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

let all = [];

function uniq(arr) {
  return [...new Set(arr)].sort((a, b) => ("" + a).localeCompare("" + b, "ru"));
}

function buildFilters(items) {
  const subjects = uniq(items.map((x) => x.subject).filter(Boolean));
  subjectSel.innerHTML =
    `<option value="">Все предметы</option>` +
    subjects.map((s) => `<option value="${s}">${s}</option>`).join("");

  const grades = uniq(items.map((x) => x.grade).filter(Boolean)).sort(
    (a, b) => a - b,
  );
  gradeSel.innerHTML =
    `<option value="">Все классы</option>` +
    grades.map((g) => `<option value="${g}">${g} класс</option>`).join("");
}

function matches(item, q, subject, grade, type) {
  const hay = [
    item.title,
    item.author,
    item.subject,
    item.type,
    (item.tags || []).join(" "),
    item.description,
  ]
    .join(" ")
    .toLowerCase();

  if (q && !hay.includes(q)) return false;
  if (subject && item.subject !== subject) return false;
  if (grade && String(item.grade) !== String(grade)) return false;
  if (type && item.type !== type) return false;
  return true;
}

function sortItems(items, mode) {
  const copy = [...items];
  if (mode === "az") {
    copy.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  } else if (mode === "old") {
    copy.sort((a, b) => new Date(a.added) - new Date(b.added));
  } else {
    copy.sort((a, b) => new Date(b.added) - new Date(a.added));
  }
  return copy;
}

function render(items) {
  countEl.textContent = `${items.length} материалов`;

  const filtersText = [];
  if (subjectSel.value) filtersText.push(`Предмет: ${subjectSel.value}`);
  if (gradeSel.value) filtersText.push(`Класс: ${gradeSel.value}`);
  if (typeSel.value) filtersText.push(`Тип: ${typeSel.value}`);
  activeFiltersEl.textContent = filtersText.length
    ? "• " + filtersText.join(" • ")
    : "";

  grid.innerHTML = items
    .map((item) => {
      const badges = [
        item.subject && `<span class="badge">${item.subject}</span>`,
        item.grade && `<span class="badge">${item.grade} класс</span>`,
        item.type && `<span class="badge">${item.type}</span>`,
      ]
        .filter(Boolean)
        .join("");

      return `
      <article class="card" data-id="${item.id}">
        <div class="badges">${badges}</div>
        <h3 class="title">${item.title}</h3>
        <p class="mini">Автор: ${item.author || "—"}</p>
        <p class="mini">Добавлено: ${item.added || "—"}</p>
      </article>
    `;
    })
    .join("");

  // клики по карточкам
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      const item =
        items.find((x) => x.id === id) || all.find((x) => x.id === id);
      if (item) openModal(item);
    });
  });
}

function apply() {
  const q = searchInput.value.trim().toLowerCase();
  const subject = subjectSel.value;
  const grade = gradeSel.value;
  const type = typeSel.value;

  const filtered = all.filter((item) => matches(item, q, subject, grade, type));
  const sorted = sortItems(filtered, sortSel.value);
  render(sorted);
}

function openModal(item) {
  const tags = (item.tags || [])
    .map((t) => `<span class="badge">${t}</span>`)
    .join(" ");
  const linkOrFile = item.link
    ? `<a class="action" href="${item.link}" target="_blank" rel="noopener">Открыть ссылку</a>`
    : item.file
      ? `<a class="action" href="${item.file}" target="_blank" rel="noopener">Открыть файл</a>
         <a class="action" href="${item.file}" download>Скачать</a>`
      : `<span class="mini">Файл/ссылка не указаны</span>`;

  modalBody.innerHTML = `
    <h2>${item.title}</h2>
    <p><b>Автор:</b> ${item.author || "—"}</p>
    <p><b>Предмет:</b> ${item.subject || "—"} • <b>Класс:</b> ${item.grade || "—"} • <b>Тип:</b> ${item.type || "—"}</p>
    <p>${item.description || ""}</p>
    <div class="badges">${tags}</div>
    <div class="actions">${linkOrFile}</div>
  `;
  modal.showModal();
}

closeModalBtn.addEventListener("click", () => modal.close());
modal.addEventListener("click", (e) => {
  // закрывать по клику вне контента
  const rect = modal.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width;
  if (!inDialog) modal.close();
});

searchInput.addEventListener("input", apply);
subjectSel.addEventListener("change", apply);
gradeSel.addEventListener("change", apply);
typeSel.addEventListener("change", apply);
sortSel.addEventListener("change", apply);
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  subjectSel.value = "";
  gradeSel.value = "";
  typeSel.value = "";
  sortSel.value = "new";
  apply();
});

async function init() {
  const res = await fetch("materials.json");
  all = await res.json();
  buildFilters(all);
  apply();
}
init();
