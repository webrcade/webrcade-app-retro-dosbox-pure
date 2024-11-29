export class Touch {
    constructor(emulator, canvas) {
        this.emulator = emulator;
        this.canvas = canvas;
        this.activeTouches = []
        this.touchStart = {};
        this.lastTouch = {};
        this.touchStartTime = 0;
        this.positionX = window.innerWidth / 2 | 0;
        this.positionY = window.innerHeight / 2 | 0;
        this.first = true;
        this.firstTouchId = null;
        this.secondTouchId = null;
        this.leftDown = false;

        window.document.addEventListener('touchstart', (e) => {
            // e.preventDefault();

            this.touchStartTime = Date.now();   // Record the time when the touch started

            this.activeTouches = Array.from(e.changedTouches);
            for (let i = 0; i < this.activeTouches.length; i++) {
                const touch = this.activeTouches[i];
                if (this.firstTouchId === null) {
                    this.firstTouchId = touch.identifier;
                    this.touchStart = { x: touch.clientX, y: touch.clientY };
                    this.lastTouch = { ...this.touchStart };

                    if (this.first) {
                        this.first = false;
                        this.simulateMouseEvent('mousemove', 1, 1, 0);
                    }
                } else if (touch.identifier !== this.firstTouchId && this.secondTouchId === null) {
                    this.secondTouchId = touch.identifier;
                    this.simulateMouseEvent('mousedown', 0, 0, 0);
                    this.leftDown = true;
                }
            }
        }, { passive: false });

        window.document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.activeTouches = Array.from(e.changedTouches);

            if (this.activeTouches.length >= 1) {
                for (let i = 0; i < this.activeTouches.length; i++) {
                    const touch = this.activeTouches[i];
                    if (touch.identifier === this.firstTouchId) {
                        // Move the cursor relative to the last touch position (delta movement)
                        const dx = touch.clientX - this.lastTouch.x;
                        const dy = touch.clientY - this.lastTouch.y;

                        // Update last touch position to the current position
                        this.lastTouch = { x: touch.clientX, y: touch.clientY };

                        // Simulate mouse movement
                        this.simulateMouseEvent('mousemove', dx, dy);
                        break;
                    }
                }
            }
        }, { passive: false });

        window.document.addEventListener('touchend', (e) => {
            // e.preventDefault();
            this.activeTouches = Array.from(e.changedTouches);

            if (this.leftDown) {
                this.leftDown = false;
                this.simulateMouseEvent('mouseup', 0, 0, 0);
            }

            for (let i = 0; i < this.activeTouches.length; i++) {
                const touch = this.activeTouches[i];
                if (touch.identifier === this.firstTouchId) {
                    this.firstTouchId = null; // Reset the first touch ID
                    if (this.secondTouchId) {
                        this.firstTouchId = this.secondTouchId;
                        this.secondTouchId = null;
                    }
                    const timeDiff = Date.now() - this.touchStartTime;
                    if (timeDiff < 200) {
                        this.emulator.touchClick |= this.emulator.MOUSE_LEFT;
                    }
                } else if (touch.identifier === this.secondTouchId) {
                    this.secondTouchId = null; // Reset the second touch ID
                    // Trigger mouse up for second finger
                }
            }
        }, { passive: false });
    }

    simulateMouseEvent(type, dx, dy, button = 0) {
        if (dx !== 0) dx *= ((this.emulator.resWidth / 640.0) * 2);
        if (dy !== 0) dy *= ((this.emulator.resHeight / 480.0) * 2);
        this.positionX += dx;
        this.positionY += dy;

        const e = {
            bubbles: true,
            cancelable: true,
            movementX: dx,
            movementY: dy,
            clientX: this.positionX,
            clientY: this.positionY,
            button: this.leftDown ? 0 : undefined,
            buttons: this.leftDown ? 1 : undefined
        }

        const mouseEvent = new MouseEvent(type, e);

        // button: button,
        // buttons: button === 0 ? 1 : 2 // left button (0) or right button (2)

        window.document.dispatchEvent(mouseEvent);
    }
}


