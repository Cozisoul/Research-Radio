import { marked } from "marked";
import DOMPurify from "dompurify";

export async function renderIssueZero(containerSelector, mdPath) {
  const el = document.querySelector(containerSelector);
  try {
    const res = await fetch(mdPath);
    const md = await res.text();
    const html = marked.parse(md, { mangle: false, headerIds: false });
    el.innerHTML = DOMPurify.sanitize(html);
  } catch (err) {
    console.error("Issue Zero load error:", err);
    el.textContent = "Failed to load Issue Zero.";
  }
}