// Improved swipe detection logic

let touchstartX = 0;
let touchstartY = 0;
let touchendX = 0;
let touchendY = 0;

const gestureZone = document.getElementById('gesture-zone'); // Assume this is your swipe area

gestureZone.addEventListener('touchstart', (event) => {
    touchstartX = event.changedTouches[0].screenX;
    touchstartY = event.changedTouches[0].screenY;
}, false);

gestureZone.addEventListener('touchend', (event) => {
    touchendX = event.changedTouches[0].screenX;
    touchendY = event.changedTouches[0].screenY;
    handleGesture();
}, false);

function handleGesture() {
    const diffX = touchendX - touchstartX;
    const diffY = touchendY - touchstartY;

    // Check if movement is horizontal and significant enough
    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 80) {
        console.log('Swipe right detected!');
        // Handle right swipe logic
    } else if (Math.abs(diffX) > Math.abs(diffY) && diffX < -80) {
        console.log('Swipe left detected!');
        // Handle left swipe logic
    }
    // Add else if for vertical swipes if needed
}

// Prevent default behavior on swipe
gestureZone.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, { passive: false });