export function initPagination({ totalItems, itemsPerPage, container, onPageChange }) {
  if (!container) return null;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  function render(currentPage) {
    container.innerHTML = Array.from({ length: totalPages })
      .map((_, i) => `
        <button class="pagination-button ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i + 1}
        </button>
      `).join('');
    container.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)))
    );
  }

  return { render };
}