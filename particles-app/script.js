window.onload = function() {
    initialize();
};

function initialize() {

    let currentText = 'MARS';

    // Get the canvas and context
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    // Define particle density and maximum particles
    const PARTICLE_DENSITY = 150; // Particles per 10,000 square pixels
    const MAX_MOVING_PARTICLES = 2000;
    const PARTICLE_SIZE_SCALE = 0.5;

    // Particle class
    function Particle(x, y, color, type, size) {
        this.x = x;
        this.y = y;
        this.originX = x; // For static destination particles
        this.originY = y;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.color = color;
        this.originalColor = color; // Store original color
        this.type = type; // Dynamic vs static particle
        this.size = size;
        this.collisionCount = 0; // Tracking collisions
        this.opacity = 1; // Opacity for fade-out effect
        this.fadeOut = false; // Control when the particle fades out
    }

    var letterParticles = [];
    var movingParticles = [];
    var mouse = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    };

    // Variables to hold current particle colors
    let staticParticleColors = [];
    let movingParticleColors = [];

    // Default to the first color palette
    const defaultPaletteIndex = 0;

    // Define color palettes
    const colorPalettes = [
        {
            name: 'Mars Theme',
            backgroundColor: '#000000',
            staticParticleColors: ['#FF6F61', '#FF8C42', '#703e00d3', '#FFC857'],
            movingParticleColors: ['#0B0C10', '#1F2833', '#C5C6C7', '#45A29E']
        },
        {
            name: 'Ocean Breeze',
            backgroundColor: '#002f4b',
            staticParticleColors: ['#00b4db', '#0083b0'],
            movingParticleColors: ['#e6e6e6', '#ffffff']
        },
        {
            name: 'Sunset Glow',
            backgroundColor: '#2C3E50',
            staticParticleColors: ['#FC354C', '#0ABFBC'],
            movingParticleColors: ['#F7F7F7', '#FFCC33']
        },
        {
            name: 'Aurora Dream',
            backgroundColor: '#0D1B2A',
            staticParticleColors: ['#3A506B', '#5BC0BE', '#1C2541'],
            movingParticleColors: ['#6FFFE9', '#D6FFB7', '#FFE156', '#FFB7C3']
        },
        {
            name: 'Cyberpunk Vibe',
            backgroundColor: '#1F1F1F',
            staticParticleColors: ['#FF0054', '#0DCAF0', '#6F42C1'],
            movingParticleColors: ['#E83E8C', '#6610F2', '#FFC107', '#20C997']
        },
        {
            name: 'Tropical Fusion',
            backgroundColor: '#344E41',
            staticParticleColors: ['#A4C3B2', '#D9BF77', '#FE7F2D'],
            movingParticleColors: ['#E07A5F', '#F4F1DE', '#81B29A', '#F2CC8F']
        },
        {
            name: 'Galaxy Nebula',
            backgroundColor: '#1A1A40',
            staticParticleColors: ['#A239CA', '#4717F6', '#E94057'],
            movingParticleColors: ['#F9ED69', '#F08A5D', '#B83B5E', '#6A0572']
        },
        {
            name: 'Forest Whisper',
            backgroundColor: '#2A363B',
            staticParticleColors: ['#99B898', '#FECEA8', '#FF847C'],
            movingParticleColors: ['#E84A5F', '#2A363B', '#F67280', '#C06C84']
        },
        {
            name: 'Lava Flow',
            backgroundColor: '#0D0A0B',
            staticParticleColors: ['#FF4500', '#FF6347', '#FF7F50'],
            movingParticleColors: ['#8B0000', '#FF6F61', '#FFD700', '#FFA500']
        },
        {
            name: 'Zen Garden',
            backgroundColor: '#EBF5DF',
            staticParticleColors: ['#B9CBB9', '#A4A399', '#71816D'],
            movingParticleColors: ['#E57373', '#FFCDD2', '#8BC34A', '#C8E6C9']
        },
        {
            name: 'Deep Forest',
            backgroundColor: '#0A2E14',  // Very dark, deep forest green
            staticParticleColors: ['#E0E0E0', '#D8D8D8', '#CFCFCF', '#BFBFBF'],  // Various shades of off-white
            movingParticleColors: ['#1B4332', '#2D6A4F', '#4A4E69', '#3A403D', '#6B4226']  // Dark greens and browns for a natural, earthy feel
        }               
        
    ];
    

    // Apply the default color palette
    applyColorPalette(defaultPaletteIndex);

    // State data
    const states = [
        // { name: 'Alabama', abbreviation: 'AL', svgPath: 'assets/state_svgs/alabama.svg' },
        // { name: 'Alaska', abbreviation: 'AK', svgPath: 'assets/state_svgs/alaska.svg' },
        // { name: 'Arizona', abbreviation: 'AZ', svgPath: 'assets/state_svgs/arizona.svg' },
        // { name: 'Arkansas', abbreviation: 'AR', svgPath: 'assets/state_svgs/arkansas.svg' },
        // // ... include all 50 states
        // { name: 'Wyoming', abbreviation: 'WY', svgPath: 'assets/state_svgs/wyoming.svg' },
        { name: 'California', abbreviation: 'CA', svgPath: 'assets/state_svgs/california.svg' },
    ];

    // Function to scale particle size based on window dimensions
    function scaleParticleSize(width, height) {
        const baseSize = 1;
        const scalingFactor = Math.min(width, height) / 800;
        return Math.max(baseSize * scalingFactor, 0.5);
    }

    // Resize canvas and handle high DPI displays
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);

        createLetterParticles(currentText);
        createMovingParticles();

        // Reset mouse position
        mouse.x = window.innerWidth / 2;
        mouse.y = window.innerHeight / 2;
    }

    // Debounce function to limit the rate at which a function can fire
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Attach the debounced resize event
    window.addEventListener('resize', debounce(resizeCanvas, 200));

    // Create particles that form letters or shapes
    function createLetterParticles(text) {
        letterParticles = [];
        var displayText = text || 'MARS'; // Default text

        const dpr = window.devicePixelRatio || 1;
        const fontSize = Math.min(canvas.width / dpr, canvas.height / dpr) * 0.2;
        const centerX = (canvas.width / dpr) / 2;
        const centerY = (canvas.height / dpr) / 2 + fontSize / 4;
        const spacing = 5;

        // Create an offscreen canvas to draw the text
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = canvas.width / dpr;
        offscreenCanvas.height = canvas.height / dpr;

        // Draw the text onto the offscreen canvas
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        offscreenCtx.fillStyle = '#FFFFFF';
        offscreenCtx.textAlign = 'center';
        offscreenCtx.textBaseline = 'middle';
        offscreenCtx.font = 'bold ' + fontSize + 'px Arial';
        offscreenCtx.fillText(displayText, centerX, centerY);

        // Get image data from offscreen canvas
        const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const data = imageData.data;

        // Create particles where text pixels are
        for (let y = 0; y < offscreenCanvas.height; y += spacing) {
            for (let x = 0; x < offscreenCanvas.width; x += spacing) {
                const index = (y * offscreenCanvas.width + x) * 4;
                if (data[index + 3] > 128) {
                    const color = getStaticParticleColor();
                    const size = scaleParticleSize(canvas.width / dpr, canvas.height / dpr) * (1 + Math.random()) * PARTICLE_SIZE_SCALE;
                    letterParticles.push(new Particle(x, y, color, 'letter', size));
                }
            }
        }
    }

    function getStaticParticleColor() {
        return staticParticleColors[Math.floor(Math.random() * staticParticleColors.length)];
    }

    function getMovingParticleColor(){
        return movingParticleColors[Math.floor(Math.random() * movingParticleColors.length)];
    }

    function createMovingParticles() {
        movingParticles = [];
        const dpr = window.devicePixelRatio || 1;
        const windowArea = (canvas.width / dpr) * (canvas.height / dpr);
        let particleCount = Math.floor((windowArea / 10000) * PARTICLE_DENSITY);
        particleCount = Math.min(particleCount, MAX_MOVING_PARTICLES);

        for (let i = 0; i < particleCount; i++) {
            const x = Math.random() * (canvas.width / dpr);
            const y = Math.random() * (canvas.height / dpr);
            const color = getMovingParticleColor();
            const size = scaleParticleSize(canvas.width / dpr, canvas.height / dpr) * PARTICLE_SIZE_SCALE;
            movingParticles.push(new Particle(x, y, color, 'moving', size));
        }
    }

    // Initial canvas setup
    resizeCanvas();

    // Mousemove Event Listener
    canvas.addEventListener('mousemove', function(e){
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw letter particles
        for (let i = 0; i < letterParticles.length; i++) {
            const p = letterParticles[i];

            // Gravitational pull to original position
            const dx = p.originX - p.x;
            const dy = p.originY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = dist * 0.01;
            const angle = Math.atan2(dy, dx);

            // Apply acceleration
            p.ax = Math.cos(angle) * force;
            p.ay = Math.sin(angle) * force;

            // Update velocity with acceleration
            p.vx += p.ax;
            p.vy += p.ay;

            // Apply velocity
            p.x += p.vx;
            p.y += p.vy;

            // Dampen velocity
            p.vx *= 0.9;
            p.vy *= 0.9;

            // Particle fading out
            if (p.fadeOut) {
                p.opacity -= 0.02;
                if (p.opacity <= 0) {
                    resetParticle(p);
                    continue;
                }
            }

            // Draw particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Update and draw moving particles
        for (let i = 0; i < movingParticles.length; i++) {
            const p = movingParticles[i];

            // Calculate distance to cursor
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Attract to cursor
            const attractRadius = 10000;
            const force = (attractRadius - dist) / attractRadius * 0.05;
            if (dist !== 0) {
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // Apply velocity
            p.x += p.vx;
            p.y += p.vy;

            // Damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            // Fade out when close to cursor
            const fadeRadius = 30;
            if (dist < fadeRadius) {
                p.fadeOut = true;
            }

            // Collision detection with letter particles
            for (let j = 0; j < letterParticles.length; j++) {
                const lp = letterParticles[j];
                const dx2 = lp.x - p.x;
                const dy2 = lp.y - p.y;
                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                const minDist2 = p.size + lp.size;

                if (dist2 < minDist2) {
                    const angle = Math.atan2(dy2, dx2);
                    const overlap = minDist2 - dist2;

                    const fx = Math.cos(angle) * overlap * 0.2;
                    const fy = Math.sin(angle) * overlap * 0.2;

                    lp.vx += fx;
                    lp.vy += fy;

                    p.vx -= fx;
                    p.vy -= fy;

                    p.collisionCount = (p.collisionCount || 0) + 1;

                    if (p.collisionCount >= 3) {
                        p.fadeOut = true;
                        break;
                    }
                }
            }

            // Particle fading out
            if (p.fadeOut) {
                p.opacity -= 0.02;
                if (p.opacity <= 0) {
                    resetParticle(p);
                    continue;
                }
            }

            // Draw particle
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function resetParticle(p) {
        const dpr = window.devicePixelRatio || 1;
        if (p.type === 'moving') {
            p.x = Math.random() * (canvas.width / dpr);
            p.y = Math.random() * (canvas.height / dpr);
            p.opacity = 1;
            p.fadeOut = false;
            p.collisionCount = 0;
            p.color = getMovingParticleColor();
            p.vx = 0;
            p.vy = 0;
            p.size = scaleParticleSize(canvas.width / dpr, canvas.height / dpr);
        } else if (p.type === 'letter') {
            p.x = p.originX;
            p.y = p.originY;
            p.vx = 0;
            p.vy = 0;
            p.opacity = 1;
            p.fadeOut = false;
            p.color = p.originalColor;
        }
    }

    animate();

    // Toolbar Event Listeners
    document.getElementById('text-option').addEventListener('click', openTextInputModal);
    document.getElementById('color-option').addEventListener('click', openColorSelectionModal);
    document.getElementById('state-option').addEventListener('click', openStateSelectionModal);

    // Text Input Modal Logic
    function openTextInputModal() {
        const modal = document.getElementById('text-modal');
        modal.classList.add('show');
        modal.style.display = 'block';
    }

    document.getElementById('text-modal-close').addEventListener('click', function() {
        const modal = document.getElementById('text-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    });

    document.getElementById('submit-text').addEventListener('click', function() {
        var userInput = document.getElementById('user-text').value.trim();
        if (userInput) {
            currentText = userInput;
            createLetterParticles(currentText);
            const modal = document.getElementById('text-modal');
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    });

    // Color Selection Modal Logic
    function openColorSelectionModal() {
        const modal = document.getElementById('color-modal');
        const container = modal.querySelector('.palette-container');
        container.innerHTML = '';

        colorPalettes.forEach((palette, index) => {
            const paletteDiv = document.createElement('div');
            paletteDiv.classList.add('palette');
            paletteDiv.setAttribute('data-index', index);

            // Display color swatches
            palette.staticParticleColors.forEach(color => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = color;
                paletteDiv.appendChild(swatch);
            });

            paletteDiv.addEventListener('click', function() {
                applyColorPalette(index);
                modal.classList.remove('show');
                modal.style.display = 'none';
            });

            container.appendChild(paletteDiv);
        });

        modal.classList.add('show');
        modal.style.display = 'block';
    }

    document.getElementById('color-modal-close').addEventListener('click', function() {
        const modal = document.getElementById('color-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    });

    function applyColorPalette(index) {
        const palette = colorPalettes[index];

        // Update background color
        document.body.style.backgroundColor = palette.backgroundColor;

        // Update particle colors
        staticParticleColors = palette.staticParticleColors;
        movingParticleColors = palette.movingParticleColors;

        // Recreate particles with new colors
        createLetterParticles(currentText);
        createMovingParticles();
    }

    // State Selection Modal Logic
    function openStateSelectionModal() {
        const modal = document.getElementById('state-modal');
        const container = modal.querySelector('.state-container');
        container.innerHTML = '';

        states.forEach((state, index) => {
            const stateDiv = document.createElement('div');
            stateDiv.classList.add('state-item');
            stateDiv.setAttribute('data-index', index);
            stateDiv.style.backgroundImage = `url(${state.svgPath})`;

            stateDiv.addEventListener('click', function() {
                applyStateOutline(index);
                modal.classList.remove('show');
                modal.style.display = 'none';
            });

            container.appendChild(stateDiv);
        });

        modal.classList.add('show');
        modal.style.display = 'block';
    }

    document.getElementById('state-modal-close').addEventListener('click', function() {
        const modal = document.getElementById('state-modal');
        modal.classList.remove('show');
        modal.style.display = 'none';
    });

    function applyStateOutline(index) {
        const state = states[index];

        // Load the state's SVG outline
        fetch(state.svgPath)
            .then(response => response.text())
            .then(svgData => {
                createStateParticles(svgData, state.abbreviation);
            })
            .catch(error => {
                console.error('Error loading state SVG:', error);
            });
    }

    function createStateParticles(svgData, abbreviation) {
        letterParticles = [];

        const dpr = window.devicePixelRatio || 1;
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCanvas.width = canvas.width / dpr;
        offscreenCanvas.height = canvas.height / dpr;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
            // Clear canvas
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            // Draw the SVG onto the offscreen canvas
            offscreenCtx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

            // Draw the state's abbreviation in the center
            const fontSize = Math.min(offscreenCanvas.width, offscreenCanvas.height) * 0.2;
            offscreenCtx.fillStyle = '#FFFFFF';
            offscreenCtx.textAlign = 'center';
            offscreenCtx.textBaseline = 'middle';
            offscreenCtx.font = 'bold ' + fontSize + 'px Arial';
            offscreenCtx.fillText(abbreviation, offscreenCanvas.width / 2, offscreenCanvas.height / 2);

            // Get image data and create particles
            const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            const data = imageData.data;
            const spacing = 5;

            for (let y = 0; y < offscreenCanvas.height; y += spacing) {
                for (let x = 0; x < offscreenCanvas.width; x += spacing) {
                    const index = (y * offscreenCanvas.width + x) * 4;
                    if (data[index + 3] > 128) {
                        const color = getStaticParticleColor();
                        const size = scaleParticleSize(canvas.width / dpr, canvas.height / dpr) * (1 + Math.random());
                        letterParticles.push(new Particle(x, y, color, 'letter', size));
                    }
                }
            }

            URL.revokeObjectURL(url);
        };

        img.onerror = function() {
            console.error('Failed to load image');
        };

        img.src = url;
    }
}
