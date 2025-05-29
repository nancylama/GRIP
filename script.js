const currStatus = document.getElementById('status');
const toggleBtn = document.getElementById('toggleStabilization');
const resetBtn = document.getElementById('resetSettings');
const smoothingSlider = document.getElementById('smoothingSlider');
const smoothingValue = document.getElementById('smoothingValue');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');
const interactionArea = document.getElementById('interactionArea');
const customCursor = document.getElementById('customCursor');
const target = document.getElementById('target');

let isStabilizationEnabled = false;
let smoothingStrength = parseInt(smoothingSlider.value);
let tremorThreshold = parseInt(thresholdSlider.value);
let positionHistory = [];
let cursorPos = { x: 0, y: 0 };
let stabilizedPos = { x: 0, y: 0 };
let lastMouseMoveTime = 0;

// handle stabilization
toggleBtn.addEventListener('click', () => {
    isStabilizationEnabled = !isStabilizationEnabled;
    currStatus.textContent = isStabilizationEnabled ? 'Stabilization ON' : 'Stabilization OFF';
    toggleBtn.textContent = isStabilizationEnabled ? 'Disable Stabilization' : 'Enable Stabilization';
    
    customCursor.style.display = isStabilizationEnabled ? 'block' : 'none';
});

// reset values
resetBtn.addEventListener('click', () => {
    smoothingSlider.value = 5;
    thresholdSlider.value = 5;
    smoothingValue.textContent = '5';
    thresholdValue.textContent = '5';
    smoothingStrength = 5;
    tremorThreshold = 5;
});

// smoothing strength
smoothingSlider.addEventListener('input', () => {
    smoothingStrength = parseInt(smoothingSlider.value);
    smoothingValue.textContent = smoothingStrength;
});

// tremor threshold
thresholdSlider.addEventListener('input', () => {
    tremorThreshold = parseInt(thresholdSlider.value);
    thresholdValue.textContent = tremorThreshold;
});

// cursor position history
function updatePositionHistory(x, y) {
    positionHistory.push({ x, y });
    
    if (positionHistory.length > smoothingStrength) {
        positionHistory.shift();
    }
}

// calculate stabilized position (averaging recent positions)
function calculateStabilizedPosition() {
    if (positionHistory.length === 0) return { x: 0, y: 0 };
    
    let sumX = 0;
    let sumY = 0;
    
    for (const pos of positionHistory) {
        sumX += pos.x;
        sumY += pos.y;
    }
    
    return {
        x: sumX / positionHistory.length,
        y: sumY / positionHistory.length
    };
}

// check if movement is tremor based on speed
function isTremor(x, y) {
    if (positionHistory.length < 2) return false;
    
    const now = Date.now();
    const timeDiff = now - lastMouseMoveTime;
    lastMouseMoveTime = now;
    
    const lastPos = positionHistory[positionHistory.length - 1];
    const dx = x - lastPos.x;
    const dy = y - lastPos.y;
    
    // speed of movement (distance / time)
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = timeDiff > 0 ? distance / timeDiff : 0;
    
    // check if speed exceeds tremor threshold
    return speed > tremorThreshold / 100;
}

// mouse movement in interaction area
interactionArea.addEventListener('mousemove', (e) => {
    const rect = interactionArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    cursorPos = { x, y };
    
    if (isStabilizationEnabled) {
        if (isTremor(x, y)) {
            // tremors: update history using stabilized position
            updatePositionHistory(x, y);
            stabilizedPos = calculateStabilizedPosition();
        } else {
            // normal movements: follow more closely but still with some smoothing
            updatePositionHistory(x, y);
            const calculatedPos = calculateStabilizedPosition();
            
            // less smoothing for intentional movements
            stabilizedPos = {
                x: calculatedPos.x * 0.7 + x * 0.3,
                y: calculatedPos.y * 0.7 + y * 0.3
            };
        }
        
        // update cursor position
        customCursor.style.left = `${stabilizedPos.x}px`;
        customCursor.style.top = `${stabilizedPos.y}px`;
    }
});

// handle clicks in the interaction area
interactionArea.addEventListener('click', (e) => {
    if (!isStabilizationEnabled) return;
    
    e.preventDefault();
    
    // stabilized position for the click
    const clickX = stabilizedPos.x;
    const clickY = stabilizedPos.y;
    
    // check if click hits target
    const targetRect = target.getBoundingClientRect();
    const areaRect = interactionArea.getBoundingClientRect();
    
    const targetX = targetRect.left - areaRect.left + targetRect.width / 2;
    const targetY = targetRect.top - areaRect.top + targetRect.height / 2;
    const targetRadius = targetRect.width / 2;
    
    const distance = Math.sqrt(
        Math.pow(clickX - targetX, 2) + 
        Math.pow(clickY - targetY, 2)
    );
    
    if (distance <= targetRadius) {
        // target hit
        target.style.backgroundColor = '#28a745';
        setTimeout(() => {
            target.style.backgroundColor = '#9B59B6';
            target.addEventListener('mousein', () => {
                target.style.backgroundColor = '#793a94';
            });
            target.addEventListener('mouseout', () => {
                target.style.backgroundColor = '';
            });
            
            // target moved to random position
            const maxX = interactionArea.clientWidth - targetRect.width;
            const maxY = interactionArea.clientHeight - targetRect.height;
            
            const newX = Math.floor(Math.random() * maxX);
            const newY = Math.floor(Math.random() * maxY);
            
            target.style.position = 'absolute';
            target.style.left = `${newX}px`;
            target.style.top = `${newY}px`;
        }, 500);
    }
});

document.addEventListener('keydown', (e) => {
if (e.ctrlKey && e.key.toLowerCase() === 's') {
    // increase smoothing
    smoothingSlider.value = Math.min(20, parseInt(smoothingSlider.value) + 1);
    smoothingSlider.dispatchEvent(new Event('input'));
} else if (e.ctrlKey && e.key.toLowerCase() === 'a') {
    // reduce smoothing
    smoothingSlider.value = Math.max(1, parseInt(smoothingSlider.value) - 1);
    smoothingSlider.dispatchEvent(new Event('input'));
} else if (e.ctrlKey && e.key.toLowerCase() === 't') {
    // increase tremor threshold
    thresholdSlider.value = Math.min(20, parseInt(thresholdSlider.value) + 1);
    thresholdSlider.dispatchEvent(new Event('input'));
} else if (e.ctrlKey && e.key.toLowerCase() === 'g') {
    // reduce tremor threshold
    thresholdSlider.value = Math.max(1, parseInt(thresholdSlider.value) - 1);
    thresholdSlider.dispatchEvent(new Event('input'));
}
});