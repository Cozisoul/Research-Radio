import { db } from '../../content/database.js';

export async function loadAllContent() {
  console.log("Loading all content from local database...");
  const content = {
    issueZero: db.issueZero,
    journal: db.journalEntries,
    projects: db.projects,
    inputs: db.currentInput,
  };
  console.log("Content loaded successfully.");
  return content;
}