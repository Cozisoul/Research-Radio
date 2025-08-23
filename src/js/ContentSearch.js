// TMM-OS: CONTENT SEARCH MODULE (V1.9)
// FILE: /src/js/ContentSearch.js
// DESC: Consolidates all content into a searchable index.

export function ContentSearch(content) {
  let searchIndex = [];

  // This function transforms all your different content types into a single, unified format.
  function buildIndex() {
    const journalCommands = content.journal.map(item => ({
      id: item.id,
      type: 'Journal',
      title: item.title,
      text: item.summary.toLowerCase(),
    }));

    const projectCommands = content.projects.map(item => ({
      id: item.title, // Use title as a unique ID for projects
      type: 'Project',
      title: item.title,
      text: item.note.toLowerCase(),
    }));
    
    // Add other content types here in the future
    searchIndex = [...journalCommands, ...projectCommands];
  }

  // The public search method
  function search(query) {
    if (!query) {
      return searchIndex; // Return all items if query is empty
    }
    const lowerCaseQuery = query.toLowerCase();
    return searchIndex.filter(item => 
      item.title.toLowerCase().includes(lowerCaseQuery) || 
      item.text.includes(lowerCaseQuery)
    );
  }

  // Build the index immediately on creation
  buildIndex();

  // The public API for this module instance
  return {
    search,
  };
}