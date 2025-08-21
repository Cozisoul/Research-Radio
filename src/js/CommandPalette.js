export function CommandPalette(windowManager, commands) {
  const palette = document.getElementById('command-palette');
  const input = document.getElementById('command-input');
  const results = document.getElementById('command-results');

  function filter(query) {
    const filtered = commands.filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()));
    results.innerHTML = filtered.map(cmd => `<li data-id="${cmd.id}">${cmd.title}</li>`).join('');
  }

  function toggle(show) {
    if (show) {
      palette.removeAttribute('hidden');
      input.focus();
      filter('');
    } else {
      palette.setAttribute('hidden', '');
    }
  }

  document.addEventListener('keydown', e => {
    if (e.metaKey && e.key === 'k') {
      e.preventDefault();
      toggle(!palette.hasAttribute('hidden'));
    }
  });

  input.addEventListener('input', () => filter(input.value));
  results.addEventListener('click', e => {
    const target = e.target.closest('li');
    if (target) {
      windowManager.openWindow(target.dataset.id);
      toggle(false);
    }
  });
}