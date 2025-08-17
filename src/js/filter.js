// TMM-OS: UTILITY MODULE
// FILE: /src/js/filter.js
// DESC: A reusable function for filtering data arrays.

export function filterItems(items, query) {
  if (!query) {
    return items; // Return all items if the query is empty
  }

  const lowerCaseQuery = query.toLowerCase();

  return items.filter(item => {
    // Check all string values in the object for a match
    return Object.values(item).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(lowerCaseQuery)
    );
  });
}