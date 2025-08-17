export async function loadCurrentInput(jsonPath, listSelector) {
  const ul = document.querySelector(listSelector);
  ul.innerHTML = "<li>Loading…</li>";

  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    // Expected shape: { reading, listening, watching, making }
    ul.innerHTML = "";
    const rows = [
      ["Reading", data.reading],
      ["Listening", data.listening],
      ["Watching", data.watching],
      ["Making", data.making]
    ];

    for (const [label, value] of rows) {
      if (!value) continue;
      const li = document.createElement("li");
      li.innerHTML = `<strong>${label}:</strong> ${value}`;
      ul.appendChild(li);
    }
  } catch (e) {
    console.error("Current Input error:", e);
    ul.innerHTML = "<li>Failed to load current inputs.</li>";
  }
}