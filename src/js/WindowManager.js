// TMM-OS: WINDOW MANAGER MODULE (V2.0)
// FILE: /src/js/WindowManager.js
// DESC: The core "operating system" for the interactive desktop environment.

import interact from 'interactjs';

export function WindowManager(desktopElement) {
  const windowTemplate = document.getElementById('window-template');
  let highestZ = 100; // Initial z-index

  // 1. CREATE A NEW WINDOW
  function createWindow(id, title) {
    const windowClone = windowTemplate.content.cloneNode(true);
    const newWindow = windowClone.querySelector('.window');
    
    newWindow.dataset.id = id;
    newWindow.querySelector('.window-title').textContent = title;
    
    // Set initial position and z-index
    newWindow.style.zIndex = ++highestZ;
    newWindow.style.top = `${Math.random() * 20 + 10}vh`; // Random initial position
    newWindow.style.left = `${Math.random() * 20 + 10}vw`;

    desktopElement.appendChild(newWindow);
    return newWindow;
  }

  // 2. MAKE A WINDOW INTERACTIVE
  function makeInteractive(windowElement) {
    interact(windowElement)
      .draggable({
        handle: '.window-header',
        inertia: true,
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: 'parent',
            endOnly: true
          })
        ],
        listeners: {
          move(event) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          }
        }
      })
      .resizable({
        edges: { left: true, right: true, bottom: true },
        listeners: {
          move(event) {
            let { x, y } = event.target.dataset;
            x = parseFloat(x) || 0;
            y = parseFloat(y) || 0;

            Object.assign(event.target.style, {
              width: `${event.rect.width}px`,
              height: `${event.rect.height}px`,
            });
          }
        }
      });

    // Bring window to front on interaction
    windowElement.addEventListener('pointerdown', () => {
      windowElement.style.zIndex = ++highestZ;
    });

    // Close button functionality
    windowElement.querySelector('.window-close-btn').addEventListener('click', () => {
      windowElement.remove();
    });
  }

  // 3. PUBLIC METHOD TO OPEN A WINDOW WITH CONTENT
  function openWindow(id, title, contentHTML) {
    // Prevent opening the same window multiple times
    if (desktopElement.querySelector(`.window[data-id="${id}"]`)) {
      return;
    }

    const newWindow = createWindow(id, title);
    newWindow.querySelector('.window-body').innerHTML = contentHTML;
    makeInteractive(newWindow);
  }

  // The public API for the WindowManager instance
  return {
    openWindow,
  };
}