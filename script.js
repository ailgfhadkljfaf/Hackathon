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
        this.assignedWaitingPoint = null;
        this.velocity = 2;
        this.destination = null;
        this.direction = 0; // Facing direction in radians
        this.taxiEndTime = null; // For taxiing timer
        this.emergency = null; // 'fire', 'engine-out', 'bird-hit', 'hydraulic-failure', 'electrical-failure'
        this.emergencyTime = null;
        this.hasWindshear = false;
        this.goAroundAttempts = 0;
        this.maxGoArounds = 2;
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
                // When landing and within 200px of runway, align to x-axis approach
                let angle = Math.atan2(dy, dx);
                if (distance > 0) {
                    this.direction = angle; // Update direction only when moving
                }
                if (this.status === 'landing' && distance <= 200) {
                    // Lock to x-axis movement (straight approach)
                    angle = dx >= 0 ? 0 : Math.PI; // 0 for moving right, PI for moving left
                    this.direction = angle;
                }
                
                // Calculate velocity based on aircraft status
                let velocity = this.velocity;
                
                // Slow down when landing
                if (this.status === 'landing') {
                    velocity = this.velocity * 0.4;
                } 
                // Slow down on ground (taxiing, waiting on ground)
                else if (!this.isInAir && (this.status === 'taxing' || this.status === 'ready-for-takeoff')) {
                    velocity = this.velocity * 0.5; // Faster taxiing speed to cover runway
                }
                
                this.x += Math.cos(angle) * velocity;
                this.y += Math.sin(angle) * velocity;
            }
        }
        
        // Check taxi timer
        if (this.status === 'taxing' && this.taxiEndTime && Date.now() > this.taxiEndTime) {
            // Remove plane after taxiing for 5 seconds
            const index = aircraft.indexOf(this);
            if (index > -1) {
                aircraft.splice(index, 1);
                if (this === selectedAircraft) {
                    selectedAircraft = null;
                }
                addLog(`${this.callsign} taxied to gate and departed`, 'success');
                updateFlightsList();
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
    '06': { x: 1034, y: 629 },
    '24': { x: 1891, y: 629 },
    '07': { x: 1946, y: 1144 },
    '25': { x: 1035, y: 1144 }
};

const approachPoints = {
    '06': { x: runways['06'].x - 100, y: runways['06'].y },
    '24': { x: runways['24'].x + 100, y: runways['24'].y },
    '07': { x: runways['07'].x - 100, y: runways['07'].y },
    '25': { x: runways['25'].x - 100, y: runways['25'].y }
};

const waitingPoints = {
    'C1': { x: 1031, y: 670 },
    'C2': { x: 1082, y: 670 },
    'C7': { x: 1847, y: 670 },
    'C8': { x: 1899, y: 670 },
    'A1': { x: 1030, y: 1111 },
    'A2': { x: 1082, y: 1111 },
    'A7': { x: 1900, y: 1111 },
    'A8': { x: 1950, y: 1111 }
};

const emergencyTypes = ['fire', 'engine-out', 'bird-hit', 'hydraulic-failure', 'electrical-failure'];

// State
let aircraft = [];
let selectedAircraft = null;
let hoveredAircraft = null;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let runwayInUse = {}; // Track when runways will be clear
let emergencyAlertShown = {}; // Track if emergency has been shown
let lastEmergencyTime = 0; // Track last emergency trigger
let gameStartTime = 0; // Track when game started
let emergencyCheckInterval = 180000; // 3 minutes in milliseconds
let initialEmergencyDelay = 20000; // 20 seconds delay before first emergency
let activeEmergencyCount = 0; // Track number of active emergencies

const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');

// Image assets
let mapImage = null;
let planeImage = null;
let planeHeavyImage = null;

// Load images
function loadImages() {
    mapImage = new Image();
    mapImage.src = 'map.png';
    
    planeImage = new Image();
    planeImage.src = 'plane.jpg';
    
    planeHeavyImage = new Image();
    planeHeavyImage.src = 'plane_heavy.jpg';
}

// Initialize
function initializeAircraft() {
    const callsigns = ['AAL123', 'DAL456', 'UAL789', 'SWA234', 'ACA567', 'BAW890', 'LAX123', 'KLM456'];
    const types = ['regular', 'heavy', 'regular', 'heavy', 'regular', 'regular', 'heavy', 'regular'];

    for (let i = 0; i < callsigns.length; i++) {
        const type = types[i];
        const models = aircraftModels[type];
        const model = models[Math.floor(Math.random() * models.length)];
        const newAircraft = new Aircraft(callsigns[i], type, model);
        
        // Position aircraft
        if (newAircraft.isInAir) {
            // Approaching planes from edges/corners
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { // Top
                newAircraft.x = Math.random() * 2000;
                newAircraft.y = 0;
            } else if (side === 1) { // Right
                newAircraft.x = 2000;
                newAircraft.y = Math.random() * 1500;
            } else if (side === 2) { // Bottom
                newAircraft.x = Math.random() * 2000;
                newAircraft.y = 1500;
            } else { // Left
                newAircraft.x = 0;
                newAircraft.y = Math.random() * 1500;
            }
        } else {
            // On ground planes at waiting points
            const waitingKeys = Object.keys(waitingPoints);
            const randomPoint = waitingKeys[Math.floor(Math.random() * waitingKeys.length)];
            newAircraft.x = waitingPoints[randomPoint].x;
            newAircraft.y = waitingPoints[randomPoint].y;
            newAircraft.status = 'ready-for-takeoff'; // Or on-ground
        }
        
        aircraft.push(newAircraft);
    }
}

function resizeCanvas() {
    const rect = mapCanvas.parentElement.getBoundingClientRect();
    mapCanvas.width = rect.width;
    mapCanvas.height = rect.height;
}

// Canvas interactions - ONLY for visualization, no selection from map
let isDragging = false;
let lastMouseX, lastMouseY;

mapCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

mapCanvas.addEventListener('mousemove', (e) => {
    const rect = mapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        panX += dx;
        panY += dy;
        // Clamp pan to prevent showing outside map
        panX = Math.max(-mapCanvas.width, Math.min(0, panX));
        panY = Math.max(-mapCanvas.height, Math.min(0, panY));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        drawMap();
    } else {
        hoveredAircraft = null;
        
        for (let plane of aircraft) {
            const screenX = plane.x * (mapCanvas.width / mapImage.width) * zoomLevel + panX;
            const screenY = plane.y * (mapCanvas.height / mapImage.height) * zoomLevel + panY;
            const distance = Math.sqrt(Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2));
            
            if (distance < 12) {
                hoveredAircraft = plane;
                break;
            }
        }
    }
});

mapCanvas.addEventListener('mouseup', () => {
    isDragging = false;
});

// Drawing
function drawMap() {
    const width = mapCanvas.width;
    const height = mapCanvas.height;

    // Draw background (map image or dark background)
    if (mapImage && mapImage.complete) {
        mapCtx.drawImage(mapImage, panX, panY, width * zoomLevel, height * zoomLevel);
    } else {
        mapCtx.fillStyle = '#0a0a0a';
        mapCtx.fillRect(0, 0, width, height);
    }

    // Calculate scaling factor from map image to canvas
    const mapImageWidth = mapImage && mapImage.complete ? mapImage.width : 2000;
    const mapImageHeight = mapImage && mapImage.complete ? mapImage.height : 1500;
    const scaleX = width / mapImageWidth;
    const scaleY = height / mapImageHeight;
    const scale = Math.min(scaleX, scaleY) * zoomLevel;

    // Runways
    mapCtx.strokeStyle = '#FFD700';
    mapCtx.lineWidth = 3;
    Object.entries(runways).forEach(([name, runway]) => {
        const x = runway.x * scaleX * zoomLevel + panX;
        const y = runway.y * scaleY * zoomLevel + panY;
        mapCtx.beginPath();
        mapCtx.arc(x, y, 8, 0, Math.PI * 2);
        mapCtx.stroke();
        
        // Label runway
        mapCtx.fillStyle = '#FFD700';
        mapCtx.font = 'bold 12px Arial';
        mapCtx.fillText(`RW${name}`, x + 12, y - 8);
    });

    // Waiting points
    mapCtx.fillStyle = '#00FF00';
    Object.entries(waitingPoints).forEach(([name, point]) => {
        const x = point.x * scaleX * zoomLevel + panX;
        const y = point.y * scaleY * zoomLevel + panY;
        mapCtx.beginPath();
        mapCtx.arc(x, y, 3, 0, Math.PI * 2);
        mapCtx.fill();
        
        // Label waiting point
        mapCtx.fillStyle = '#00FF00';
        mapCtx.font = 'bold 10px Arial';
        mapCtx.fillText(name, x + 10, y + 3);
    });

    // Aircraft
    aircraft.forEach(plane => {
        const x = plane.x * scaleX * zoomLevel + panX;
        const y = plane.y * scaleY * zoomLevel + panY;
        
        // Skip drawing if outside visible area to prevent glitches
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) return;
        
        // Selection highlight (yellow)
        if (plane === selectedAircraft) {
            mapCtx.strokeStyle = '#FFFF00';
            mapCtx.lineWidth = 3;
            mapCtx.beginPath();
            mapCtx.arc(x, y, 16, 0, Math.PI * 2);
            mapCtx.stroke();
        }
        
        // Hover highlight (green glow)
        if (plane === hoveredAircraft) {
            mapCtx.strokeStyle = '#00FF00';
            mapCtx.lineWidth = 2;
            mapCtx.beginPath();
            mapCtx.arc(x, y, 14, 0, Math.PI * 2);
            mapCtx.stroke();
        }

        // Emergency highlight (red glow)
        if (plane.emergency) {
            mapCtx.strokeStyle = '#FF0000';
            mapCtx.lineWidth = 3;
            mapCtx.beginPath();
            mapCtx.arc(x, y, 20, 0, Math.PI * 2);
            mapCtx.stroke();
        }

        // Aircraft symbol - draw image or fallback to circle
        const imageSize = 20;
        const img = plane.type === 'heavy' ? planeHeavyImage : planeImage;
        
        if (img && img.complete) {
            // Draw image
            mapCtx.save();
            mapCtx.translate(x, y);
            let rot = plane.direction;
            if (plane.type === 'regular') rot += Math.PI / 2; // Adjust for image orientation
            mapCtx.rotate(rot);
            mapCtx.drawImage(img, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
            mapCtx.restore();
        } else {
            // Fallback: draw circle
            mapCtx.fillStyle = plane.emergency ? '#FF3333' : (plane.type === 'heavy' ? '#FF6B6B' : '#4ECDC4');
            mapCtx.beginPath();
            mapCtx.arc(x, y, plane === selectedAircraft ? 10 : 6, 0, Math.PI * 2);
            mapCtx.fill();
        }

        // Callsign label
        mapCtx.fillStyle = '#fff';
        mapCtx.font = 'bold 11px Arial';
        mapCtx.strokeStyle = '#000';
        mapCtx.lineWidth = 3;
        mapCtx.strokeText(plane.callsign, x + 14, y - 8);
        mapCtx.fillStyle = '#fff';
        mapCtx.fillText(plane.callsign, x + 14, y - 8);
        
        // Emergency indicator
        if (plane.emergency) {
            mapCtx.fillStyle = '#FF0000';
            mapCtx.font = 'bold 14px Arial';
        }
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
        
        // Get location info
        let locationInfo = 'N/A';
        if (plane.assignedRunway) {
            locationInfo = `Runway ${plane.assignedRunway}`;
        } else if (plane.assignedWaitingPoint) {
            locationInfo = `Waiting Point ${plane.assignedWaitingPoint}`;
        } else if (plane.isInAir) {
            locationInfo = 'Approaching';
        } else {
            locationInfo = 'On Ground';
        }
        
        // Check emergency status
        let emergencyBadge = '';
        if (plane.emergency) {
            emergencyBadge = `<span class="emergency-badge ${plane.emergency}">🚨 ${plane.emergency.replace('-', ' ').toUpperCase()}</span>`;
        }
        
        div.innerHTML = `
            <div class="flight-callsign">${plane.callsign}</div>
            <div class="flight-info">
                <span class="flight-type">${plane.type}</span>
                <span class="flight-status">${plane.status}</span>
                <span class="flight-location">${locationInfo}</span>
            </div>
            ${emergencyBadge}
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
    
    if (!selectedAircraft || !aircraft.includes(selectedAircraft)) {
        selectedAircraft = null;
        detailsPanel.innerHTML = '<p class="placeholder">Select a flight from the list</p>';
        document.querySelectorAll('.command-group').forEach(g => g.style.display = 'none');
        return;
    }

    let locationInfo = 'N/A';
    if (selectedAircraft.assignedRunway) {
        locationInfo = `Runway ${selectedAircraft.assignedRunway}`;
    } else if (selectedAircraft.assignedWaitingPoint) {
        locationInfo = `Waiting Point ${selectedAircraft.assignedWaitingPoint}`;
    } else if (selectedAircraft.isInAir) {
        locationInfo = 'Approaching';
    } else {
        locationInfo = 'On Ground';
    }

    let emergencyInfo = '';
    if (selectedAircraft.emergency) {
        emergencyInfo = `<div class="aircraft-detail emergency-alert"><strong>🚨 EMERGENCY: ${selectedAircraft.emergency.toUpperCase()}</strong></div>`;
    }

    detailsPanel.innerHTML = `
        <div class="aircraft-detail"><strong>${selectedAircraft.callsign}</strong> | ${selectedAircraft.type.toUpperCase()} | ${selectedAircraft.status}</div>
        <div class="aircraft-detail">Model: ${selectedAircraft.aircraftModel} | Position: (${Math.round(selectedAircraft.x)}, ${Math.round(selectedAircraft.y)})</div>
        <div class="aircraft-detail">Location: ${locationInfo}</div>
        ${emergencyInfo}
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
    if (!selectedAircraft || !aircraft.includes(selectedAircraft)) {
        addLog('No aircraft selected', 'error');
        selectedAircraft = null;
        return;
    }

    switch (command) {
        case 'runway':
            // Check if runway is clear (3 minutes for heavy aircraft)
            if (runwayInUse[value] && runwayInUse[value] > Date.now()) {
                const remainingTime = Math.ceil((runwayInUse[value] - Date.now()) / 1000);
                addLog(`${selectedAircraft.callsign} - Runway ${value} in use, clear in ${remainingTime}s`, 'warning');
                return;
            }
            
            selectedAircraft.destination = approachPoints[value];
            selectedAircraft.status = 'approaching';
            selectedAircraft.isInAir = true; // Still in air during approach
            selectedAircraft.assignedRunway = value;
            
            // Block runway for 3 minutes if heavy aircraft
            const blockTime = selectedAircraft.type === 'heavy' ? 180000 : 60000; // 3 min for heavy, 1 min for regular
            runwayInUse[value] = Date.now() + blockTime;
            
            addLog(`${selectedAircraft.callsign} cleared to land on runway ${value}`, 'success');
            break;
        case 'runway-takeoff':
            // Check if runway is clear
            if (runwayInUse[value] && runwayInUse[value] > Date.now()) {
                const remainingTime = Math.ceil((runwayInUse[value] - Date.now()) / 1000);
                addLog(`${selectedAircraft.callsign} - Runway ${value} in use, clear in ${remainingTime}s`, 'warning');
                return;
            }
            
            selectedAircraft.destination = runways[value];
            selectedAircraft.status = 'taking-off';
            selectedAircraft.assignedRunway = value;
            
            // Block runway
            const blockTimeTO = selectedAircraft.type === 'heavy' ? 180000 : 60000;
            runwayInUse[value] = Date.now() + blockTimeTO;
            
            addLog(`${selectedAircraft.callsign} cleared for takeoff from runway ${value}`, 'success');
            break;
        case 'taxi':
            selectedAircraft.destination = waitingPoints[value];
            selectedAircraft.status = 'taxing';
            selectedAircraft.assignedWaitingPoint = value;
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

// Validate runway approach direction
function isValidApproachDirection(runwayName, approachAngle) {
    const runway = runways[runwayName];
    if (!runway) return true;
    
    // Normalize angle to 0-360 degrees
    let angleDegrees = (approachAngle * 180 / Math.PI + 360) % 360;
    
    // Define valid approach angles (with ±45 degree tolerance)
    const directions = {
        '06': { min: 315, max: 45 },      // Left to right (0 degrees)
        '07': { min: 315, max: 45 },      // Left to right (0 degrees)
        '24': { min: 135, max: 225 },     // Right to left (180 degrees)
        '25': { min: 135, max: 225 }      // Right to left (180 degrees)
    };
    
    const validRange = directions[runwayName];
    if (!validRange) return true;
    
    // Check if angle falls within valid range
    if (validRange.min > validRange.max) {
        // Range wraps around 0 degrees
        return angleDegrees >= validRange.min || angleDegrees <= validRange.max;
    } else {
        return angleDegrees >= validRange.min && angleDegrees <= validRange.max;
    }
}

// Emergency and Windshear Management
function triggerRandomEmergency() {
    const now = Date.now();
    
    // Check if initial 20-second delay has passed
    if (now - gameStartTime < initialEmergencyDelay) {
        return; // Still in initial delay period
    }
    
    // Check if it's time for emergency (every 3 minutes after initial delay)
    if (now - lastEmergencyTime < emergencyCheckInterval) {
        return; // Not time yet
    }
    
    lastEmergencyTime = now;
    
    // Only allow 1-2 active emergencies at a time
    if (activeEmergencyCount >= 2) {
        return;
    }
    
    // Get list of aircraft in air without emergency
    const candidatePlanes = aircraft.filter(p => p.isInAir && !p.emergency);
    
    if (candidatePlanes.length === 0) {
        return; // No candidates available
    }
    
    // Choose 1 or 2 random emergencies
    const emergencyCount = Math.random() > 0.6 ? 2 : 1; // 40% chance for 2, 60% for 1
    const actualCount = Math.min(emergencyCount, Math.min(2 - activeEmergencyCount, candidatePlanes.length));
    
    for (let i = 0; i < actualCount; i++) {
        if (candidatePlanes.length === 0) break;
        
        // Pick a random aircraft from candidates
        const planeIndex = Math.floor(Math.random() * candidatePlanes.length);
        const plane = candidatePlanes[planeIndex];
        
        // Assign a random emergency
        const emergency = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
        plane.emergency = emergency;
        plane.emergencyTime = now;
        activeEmergencyCount++;
        
        addLog(`🚨 EMERGENCY: ${plane.callsign} - ${emergency.replace('-', ' ').toUpperCase()}!`, 'error');
        updateFlightsList();
        
        // Remove from candidates so we don't pick the same plane twice
        candidatePlanes.splice(planeIndex, 1);
    }
}

function triggerWindshear(plane) {
    // Trigger when aircraft is landing
    if (plane.status === 'landing' && Math.random() > 0.85) {
        plane.hasWindshear = true;
        plane.goAroundAttempts++;
        addLog(`⚠️ WINDSHEAR: ${plane.callsign} experiencing windshear, initiating go-around!`, 'warning');
        return true;
    }
    return false;
}

function handleAircraftLanding(plane) {
    // Check for windshear
    if (triggerWindshear(plane)) {
        // Send aircraft back to holding pattern
        plane.status = 'go-around';
        plane.destination = { x: plane.x - 100, y: plane.y - 100 }; // Temporary go-around point
        plane.isInAir = true;
        
        if (plane.goAroundAttempts > plane.maxGoArounds) {
            addLog(`${plane.callsign} exceeded maximum go-around attempts, diverting to alternate airport`, 'warning');
            plane.status = 'diverting';
            plane.destination = { x: -400, y: -400 }; // Divert
        }
        updateFlightsList();
        return;
    }
    
    // Successful landing
    plane.status = 'taxing';
    plane.isInAir = false;
    plane.taxiEndTime = Date.now() + 5000; // Disappear after 5 seconds of taxiing
    
    // Set taxi destination to opposite runway
    const oppositeRunways = {
        '06': '24',
        '24': '06',
        '07': '25',
        '25': '07'
    };
    const opposite = oppositeRunways[plane.assignedRunway];
    plane.destination = runways[opposite];
    
    // Clear emergency if it was resolved
    if (plane.emergency) {
        addLog(`${plane.callsign} successfully landed despite ${plane.emergency} - emergency resolved, taxiing to gate`, 'success');
        activeEmergencyCount = Math.max(0, activeEmergencyCount - 1);
        plane.emergency = null;
    } else {
        addLog(`${plane.callsign} successfully landed on runway ${plane.assignedRunway}, taxiing to gate`, 'success');
    }
    
    plane.assignedRunway = null;
    updateFlightsList();
}

function checkAircraftAtDestination() {
    aircraft.forEach(plane => {
        if (plane.destination) {
            const dx = plane.destination.x - plane.x;
            const dy = plane.destination.y - plane.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Aircraft reached destination
            if (distance < 5) {
                plane.destination = null;
                
                if (plane.status === 'approaching') {
                    plane.status = 'landing';
                    plane.destination = runways[plane.assignedRunway];
                    plane.isInAir = false;
                    addLog(`${plane.callsign} starting final approach to runway ${plane.assignedRunway}`, 'info');
                } else if (plane.status === 'landing') {
                    handleAircraftLanding(plane);
                } else if (plane.status === 'taking-off') {
                    plane.status = 'airborne';
                    plane.isInAir = true;
                    addLog(`${plane.callsign} airborne from runway ${plane.assignedRunway}`, 'success');
                    plane.assignedRunway = null;
                    updateFlightsList();
                } else if (plane.status === 'taxing') {
                    // Taxiing to waiting point
                    plane.status = 'ready-for-takeoff';
                    addLog(`${plane.callsign} reached waiting point ${plane.assignedWaitingPoint}`, 'success');
                    updateFlightsList();
                } else if (plane.status === 'go-around') {
                    // Re-attempt landing
                    plane.status = 'landing';
                    plane.destination = runways[plane.assignedRunway];
                    addLog(`${plane.callsign} re-attempting landing on runway ${plane.assignedRunway}`, 'warning');
                    updateFlightsList();
                }
            }
        }
    });
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
    checkAircraftAtDestination();
    triggerRandomEmergency();
    drawMap();
    requestAnimationFrame(animate);
}

// Start
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
loadImages(); // Load image assets
initializeAircraft();
gameStartTime = Date.now(); // Initialize game start time for emergency delay
updateFlightsList();
updateAircraftDetails();
animate();

addLog('ATC Simulator initialized', 'success');
addLog('Click an aircraft on the list to select', 'info');
