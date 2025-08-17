import { paginate } from "./pagination.js";

// Renders "Signals & Projects" list (episodes)
export async function loadEpisodes(jsonPath, listSelector) {
  const ul = document.querySelector(listSelector);
  ul.innerHTML = "<li>Loading…</li>";

  try {
    const res = await fetch(jsonPath);
    const { episodes } = await res.json(); // [{title, url, date}]
    ul.innerHTML = "";
    episodes.forEach(ep => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${ep.url}" target="_blank" rel="noopener">${ep.title}</a><time datetime="${ep.date}">${ep.date}</time>`;
      ul.appendChild(li);
    });
  } catch (e) {
    console.error("Episodes error:", e);
    ul.innerHTML = "<li>Failed to load episodes.</li>";
  }
}

// Renders Journal list (+ pagination)
export async function renderJournal(jsonPath, listSelector, pagerSelector) {
  const ul = document.querySelector(listSelector);
  const pager = document.querySelector(pagerSelector);
  ul.innerHTML = "<li>Loading…</li>";

  try {
    const res = await fetch(jsonPath);
    const { journal } = await res.json(); // [{date, text}]
    const perPage = 5;
    let currentPage = 1;

    const renderPage = (page) => {
      const { items, pageCount } = paginate(journal, page, perPage);
      ul.innerHTML = "";
      items.forEach(j => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${j.text}</span><time datetime="${j.date}">${j.date}</time>`;
        ul.appendChild(li);
      });
      renderPager(pageCount, page);
    };

    const renderPager = (total, active) => {
      pager.innerHTML = "";
      for (let p = 1; p <= total; p++) {
        const btn = document.createElement("button");
        btn.className = "pagination-button" + (p === active ? " active" : "");
        btn.type = "button";
        btn.setAttribute("aria-label", `Page ${p}`);
        if (p === active) btn.setAttribute("aria-current", "page");
        btn.textContent = p;
        btn.addEventListener("click", () => {
          currentPage = p;
          renderPage(currentPage);
        });
        pager.appendChild(btn);
      }
    };

    renderPage(currentPage);
    return { total: journal.length, perPage };
  } catch (e) {
    console.error("Journal error:", e);
    ul.innerHTML = "<li>Failed to load journal.</li>";
    return null;
  }
}