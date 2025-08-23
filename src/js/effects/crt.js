// TMM-OS Dither Cam v3.0 (CPU-Based Aesthetic Refactor - Definitive Build)

let capture;
let ditherEffect;
let thresholdSlider;
let isInitialized = false;

// This array MUST match the theme classes in your style.css
const themes = [
    'theme-poetic-light', 'theme-systemic-light', 
    'theme-poetic-dark', 'theme-systemic-dark', 
    'theme-cyan-dark', 'theme-cyan-light', 
    'theme-mono-light', 'theme-mono-dark'
];
let currentThemeIndex = 0;



// --- The aesthetically correct dither algorithm (from your stable build) ---
class DitherEffect {
  constructor() { this.palette = [[0,0,0], [255,255,255]]; }
  
  findClosest(r,g,b) {
    let best = this.palette[0], min = 1e9;
    for (const col of this.palette) {
      const d = Math.hypot(r-col[0], g-col[1], b-col[2]);
      if (d < min) { min = d; best = col; }
    }
    return best;
  }
  
  // This is the stable, bug-fixed version of the apply function.
  apply(src) {
    src.loadPixels();
    const w = src.width, h = src.height;
    const dst = createImage(w,h);
    const pixelsCopy = Array.from(src.pixels); // Create a safe, mutable copy
    dst.loadPixels();

    for (let y=0;y<h;y++) {
      for (let x=0;x<w;x++) {
        const i=(x+y*w)*4;
        const [r,g,b] = [pixelsCopy[i], pixelsCopy[i+1], pixelsCopy[i+2]];
        const [nr,ng,nb] = this.findClosest(r,g,b);
        dst.pixels[i]=nr; dst.pixels[i+1]=ng; dst.pixels[i+2]=nb; dst.pixels[i+3]=255;
        const er=r-nr, eg=g-ng, eb=b-nb;
        this._spread(pixelsCopy, w, h, er,eg,eb, x+1, y,  7/16);
        this._spread(pixelsCopy, w, h, er,eg,eb, x-1, y+1,3/16);
        this._spread(pixelsCopy, w, h, er,eg,eb, x,   y+1,5/16);
        this._spread(pixelsCopy, w, h, er,eg,eb, x+1, y+1,1/16);
      }
    }
    dst.updatePixels();
    return dst;
  }

  _spread(pixels, w, h, er, eg, eb, x, y, fac) {
    if (x<0||x>=w||y<0||y>=h) return;
    const i=(x+y*w)*4;
    pixels[i]   += er*fac;
    pixels[i+1] += eg*fac;
    pixels[i+2] += eb*fac;
  }
}


function setup() {
    // --- CANVAS & WEBCAM SETUP ---
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = createCanvas(640, 480);
    canvas.parent(canvasContainer);
    noSmooth();

    capture = createCapture(VIDEO);
    capture.size(640, 480);
    capture.hide();
    
    ditherEffect = new DitherEffect();
}

function draw() {
    // --- ONE-TIME INITIALIZATION ---
    if (!isInitialized) {
        thresholdSlider = document.getElementById('detail-slider');

        const toggleThemeBtn = document.getElementById('toggle-theme-btn');
        toggleThemeBtn.addEventListener('click', () => {
            document.body.classList.remove(themes[currentThemeIndex]);
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            document.body.classList.add(themes[currentThemeIndex]);
            applyTheme();
        });

        const captureBtn = document.getElementById('capture-btn');
        captureBtn.addEventListener('click', () => {
            saveCanvas('tmm-os-dither-capture.png');
        });

        const recordBtn = document.getElementById('record-btn');
        recordBtn.addEventListener('click', () => {
            alert("Recording functionality is planned for a future version!");
        });

        document.body.classList.add(themes[currentThemeIndex]);
        applyTheme();
        isInitialized = true;
    }

    // --- MAIN RENDER LOOP ---
    if (!capture.loadedmetadata) {
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
        loadingOverlay.classList.add('hidden');
    }

    const src = capture.get();
    
    // The slider now correctly controls the resolution (detail)
    const detail = map(thresholdSlider.value, 0, 1, 8, 1);
    src.resize(width / detail, height / detail);
    
    const dithered = ditherEffect.apply(src);
    
    image(dithered, 0, 0, width, height);
}

// --- THEME LOGIC (THE DEFINITIVE FIX) ---
function applyTheme() {
    const computedStyle = getComputedStyle(document.body);
    const fgColor = parseRgb(computedStyle.getPropertyValue('--dither-fg').trim());
    const bgColor = parseRgb(computedStyle.getPropertyValue('--dither-bg').trim());
    
    const currentThemeName = themes[currentThemeIndex];

    // THE FIX: We use special-case logic for the themes that need a specific
    // artistic palette that is different from the UI palette.
    if (currentThemeName === 'theme-poetic-dark') {
        // This is the original "Red/Blue" aesthetic: Dark Blue on Red
        ditherEffect.palette = [[0, 31, 63], [255, 65, 54]];
    } else if (currentThemeName === 'theme-systemic-dark') {
        // This is the opposite: Red on Dark Blue
        ditherEffect.palette = [[255, 65, 54], [0, 31, 63]];
    } else {
        // For all other themes, the dither palette matches the UI palette.
        ditherEffect.palette = [fgColor, bgColor];
    }
}

function parseRgb(rgbString) {
    const match = rgbString.match(/(\d+)\D+(\d+)\D+(\d+)/);
    if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    return [0, 0, 0];
}