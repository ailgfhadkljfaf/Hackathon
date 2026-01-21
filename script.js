// ATC Simulator - Clean Version
class Aircraft {
    constructor(callsign, type, aircraftModel) {
        this.callsign = callsign;
        this.type = type;
        this.aircraftModel = aircraftModel;
        this.x = Math.random() * 600 - 300;
        this.y = Math.random() * 600 - 300;
        this.isInAir = Math.random() > 0.5;
        this.status = this.isInAir ? 'approaching' : 'on-ground';
        this.assignedRunway = null;
        this.assignedTaxiPoint = null;
        this.velocity = 2;
        this.destination = null;
    }

    update() {
        if (this.destination) {
            const dx = this.destination.x - this.x;
            const dy = this.destination.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.x = this.destination.x;
                this.y = this.destination.y;
                this.destination = null;
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.velocity;
                this.y += Math.sin(angle) * this.velocity;
            }
        }
    }
}

// Data
const aircraftModels = {
    regular: ['A320', 'A319', 'B737', 'B757'],
    heavy: ['A380', 'B747', 'B777', 'A350']
};

const runways = {
    '06': { x: -100, y: 350 },
    '24': { x: 100, y: 350 },
    '07': { x: -100, y: -350 },
    '25': { x: 100, y: -350 }
};

const waitingPoints = {
    'C1': { x: -280, y: 200 },
    'C2': { x: -230, y: 200 },
    'C7': { x: -180, y: 200 },
    'C8': { x: -130, y: 200 },
    'A1': { x: -80, y: -250 },
    'A2': { x: -30, y: -250 },
    'A7': { x: 20, y: -250 },
    'A8': { x: 70, y: -250 }
};

// State
let aircraft = [];
let selectedAircraft = null;
let hoveredAircraft = null;
let zoomLevel = 1;

const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

// Initialize
function initializeAircraft() {
    const callsigns = ['AAL123', 'DAL456', 'UAL789', 'SWA234', 'ACA567', 'BAW890', 'LAX123', 'KLM456'];
    const types = ['regular', 'heavy', 'regular', 'heavy', 'regular', 'regular', 'heavy', 'regular'];

    for (let i = 0; i < callsigns.length; i++) {
        const type = types[i];
        const models = aircraftModels[type];
        const model = models[Math.floor(Math.random() * models.length)];
        aircraft.push(new Aircraft(callsigns[i], type, model));
    }
}

function resizeCanvas() {
    const rect = mapCanvas.parentElement.getBoundingClientRect();
    mapCanvas.width = rect.width;
    mapCanvas.height = rect.height;
}

// Canvas interactions - ONLY for visualization, no selection from map
mapCanvas.addEventListener('mousemove', (e) => {
    // Just update hover for visual effect, but don't select on click
    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const centerX = mapCanvas.width / 2;
    const centerY = mapCanvas.height / 2;
    const mapScale = zoomLevel / 1000;

    hoveredAircraft = null;
    
    for (let plane of aircraft) {
        const screenX = centerX + plane.x * mapScale;
        const screenY = centerY + plane.y * mapScale;
        const distance = Math.sqrt(Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2));
        
        if (distance < 12) {
            hoveredAircraft = plane;
            break;
        }
    }
});

// Drawing
function drawMap() {
    const width = mapCanvas.width;
    const height = mapCanvas.height;

    mapCtx.fillStyle = '#0a0a0a';
    mapCtx.fillRect(0, 0, width, height);

    const mapScale = zoomLevel / 1000;
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid
    mapCtx.strokeStyle = '#333';
    mapCtx.lineWidth = 0.5;
    for (let i = -500; i <= 500; i += 100) {
        const x = centerX + i * mapScale;
        const y = centerY + i * mapScale;
        mapCtx.beginPath();
        mapCtx.moveTo(x, centerY - 500 * mapScale);
        mapCtx.lineTo(x, centerY + 500 * mapScale);
        mapCtx.stroke();
        mapCtx.beginPath();
        mapCtx.moveTo(centerX - 500 * mapScale, y);
        mapCtx.lineTo(centerX + 500 * mapScale, y);
        mapCtx.stroke();
    }

    // Runways
    mapCtx.strokeStyle = '#FFD700';
    mapCtx.lineWidth = 2;
    Object.values(runways).forEach(runway => {
        const x = centerX + runway.x * mapScale;
        const y = centerY + runway.y * mapScale;
        mapCtx.beginPath();
        mapCtx.arc(x, y, 6, 0, Math.PI * 2);
        mapCtx.stroke();
    });

    // Waiting points
    mapCtx.fillStyle = '#00FF00';
    Object.values(waitingPoints).forEach(point => {
        const x = centerX + point.x * mapScale;
        const y = centerY + point.y * mapScale;
        mapCtx.beginPath();
        mapCtx.arc(x, y, 4, 0, Math.PI * 2);
        mapCtx.fill();
    });

    // Aircraft
    aircraft.forEach(plane => {
        const x = centerX + plane.x * mapScale;
        const y = centerY + plane.y * mapScale;
        
        // Selection highlight (yellow)
        if (plane === selectedAircraft) {
            mapCtx.strokeStyle = '#FFFF00';
            mapCtx.lineWidth = 3;
            mapCtx.beginPath();
            mapCtx.arc(x, y, 14, 0, Math.PI * 2);
            mapCtx.stroke();
        }
        
        // Hover highlight (green glow)
        if (plane === hoveredAircraft) {
            mapCtx.strokeStyle = '#00FF00';
            mapCtx.lineWidth = 2;
            mapCtx.beginPath();
            mapCtx.arc(x, y, 12, 0, Math.PI * 2);
            mapCtx.stroke();
        }

        // Aircraft symbol
        mapCtx.fillStyle = plane.type === 'heavy' ? '#FF6B6B' : '#4ECDC4';
        mapCtx.beginPath();
        mapCtx.arc(x, y, plane === selectedAircraft ? 10 : 6, 0, Math.PI * 2);
        mapCtx.fill();

        // Callsign label
        mapCtx.fillStyle = '#fff';
        mapCtx.font = '10px Arial';
        mapCtx.fillText(plane.callsign, x + 8, y - 5);
    });
}

function updateFlightsList() {
    const flightsInAir = document.getElementById('flightsInAir');
    const flightsOnGround = document.getElementById('flightsOnGround');
    flightsInAir.innerHTML = '';
    flightsOnGround.innerHTML = '';

    aircraft.forEach(plane => {
        const div = document.createElement('div');
        div.className = 'flight-item' + (plane === selectedAircraft ? ' selected' : '');
        div.innerHTML = `
            <div class="flight-callsign">${plane.callsign}</div>
            <div class="flight-info">
                <span class="flight-type">${plane.type}</span>
                <span class="flight-status">${plane.status}</span>
            </div>
        `;
        
        // Hover effect
        div.addEventListener('mouseenter', () => {
            if (plane !== selectedAircraft) {
                div.style.borderColor = '#00ff00';
            }
        });
        
        div.addEventListener('mouseleave', () => {
            if (plane !== selectedAircraft) {
                div.style.borderColor = '#333';
            }
        });
        
        // Click to select - use closure to capture correct plane
        (function(currentPlane) {
            div.onclick = function(e) {
                e.stopPropagation();
                selectedAircraft = currentPlane;
                updateFlightsList();
                updateAircraftDetails();
                drawMap();
            };
        })(plane);
        
        if (plane.isInAir) {
            flightsInAir.appendChild(div);
        } else {
            flightsOnGround.appendChild(div);
        }
    });
}

function updateAircraftDetails() {
    const detailsPanel = document.getElementById('selectedAircraftInfo');
    
    if (!selectedAircraft) {
        detailsPanel.innerHTML = '<p class="placeholder">Select a flight from the list</p>';
        document.querySelectorAll('.command-group').forEach(g => g.style.display = 'none');
        return;
    }

    detailsPanel.innerHTML = `
        <div class="aircraft-detail"><strong>${selectedAircraft.callsign}</strong> | ${selectedAircraft.type.toUpperCase()} | ${selectedAircraft.status}</div>
        <div class="aircraft-detail">Model: ${selectedAircraft.aircraftModel} | Position: (${Math.round(selectedAircraft.x)}, ${Math.round(selectedAircraft.y)})</div>
    `;

    // Show/hide command groups
    document.querySelectorAll('.command-group').forEach(group => {
        const label = group.querySelector('label').textContent;
        if (label.includes('Landing')) {
            group.style.display = selectedAircraft.isInAir ? 'block' : 'none';
        } else if (label.includes('Takeoff') || label.includes('Taxi')) {
            group.style.display = !selectedAircraft.isInAir ? 'block' : 'none';
        } else {
            group.style.display = 'block';
        }
    });
}

function handleCommand(command, value) {
    if (!selectedAircraft) {
        addLog('No aircraft selected', 'error');
        return;
    }

    switch (command) {
        case 'runway':
            selectedAircraft.destination = runways[value];
            selectedAircraft.status = 'landing';
            selectedAircraft.isInAir = false;
            addLog(`${selectedAircraft.callsign} cleared to land on runway ${value}`, 'success');
            break;
        case 'runway-takeoff':
            selectedAircraft.destination = runways[value];
            selectedAircraft.status = 'taking-off';
            addLog(`${selectedAircraft.callsign} cleared for takeoff from runway ${value}`, 'success');
            break;
        case 'taxi':
            selectedAircraft.destination = waitingPoints[value];
            selectedAircraft.status = 'taxing';
            addLog(`${selectedAircraft.callsign} cleared to taxi to ${value}`, 'success');
            break;
        case 'hold':
            selectedAircraft.status = 'waiting';
            selectedAircraft.destination = null;
            addLog(`${selectedAircraft.callsign} instructed to hold`, 'warning');
            break;
        case 'wait-airspace':
            selectedAircraft.status = 'waiting';
            selectedAircraft.destination = null;
            addLog(`${selectedAircraft.callsign} cleared to wait in airspace`, 'warning');
            break;
    }

    updateAircraftDetails();
    updateFlightsList();
}

function addLog(message, type = 'info') {
    const log = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
    
    log.insertBefore(entry, log.firstChild);
    
    while (log.children.length > 20) {
        log.removeChild(log.lastChild);
    }
}

// Controls
document.getElementById('zoomIn').addEventListener('click', () => {
    zoomLevel = Math.min(zoomLevel * 1.2, 3);
    drawMap();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    zoomLevel = Math.max(zoomLevel / 1.2, 0.5);
    drawMap();
});

document.querySelectorAll('.cmd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        handleCommand(btn.dataset.command, btn.dataset.value);
    });
});

// Main loop
function animate() {
    aircraft.forEach(plane => plane.update());
    drawMap();
    requestAnimationFrame(animate);
}

// Start
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
initializeAircraft();
updateFlightsList();
updateAircraftDetails();
animate();

addLog('ATC Simulator initialized', 'success');
addLog('Click an aircraft on the list to select', 'info');
