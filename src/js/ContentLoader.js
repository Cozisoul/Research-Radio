// TMM-OS: CONTENT LOADER MODULE (DEFINITIVE V1.7 - ROBUST)
// FILE: /src/js/ContentLoader.js
// DESC: Fetches and parses all content with explicit error logging.

import { marked } from 'marked';

async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      // This will now clearly log a 404 error in the console.
      console.error(`File not found: ${url} (Status: ${response.status})`);
      return [];
    }
    return response.json();
  } catch (error) {
    // This will now clearly log if the JSON is malformed.
    console.error(`Failed to fetch or parse JSON from ${url}:`, error);
    return []; // Return an empty array as a failsafe
  }
}

async function fetchMarkdown(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`File not found: ${url} (Status: ${response.status})`);
      return "<p>Error: Content could not be loaded.</p>";
    }
    const markdown = await response.text();
    return marked.parse(markdown);
  } catch (error) {
    console.error(`Failed to fetch or parse Markdown from ${url}:`, error);
    return "<p>Error: Content could not be loaded.</p>"; // Failsafe HTML
  }
}

// This public function remains the same, but now benefits from the robust fetchers.
export async function loadAllContent() {
  const [journal, projects, inputs, issueZero] = await Promise.all([
    fetchJSON('/content/journal.json'),
    fetchJSON('/content/projects.json'),
    fetchJSON('/content/inputs.json'),
    fetchMarkdown('/content/issue-zero.md')
  ]);

  return { journal, projects, inputs, issueZero };
}