export class Touch {
    constructor(emulator, canvas) {
        this.emulator = emulator;
        this.canvas = canvas;
        this.touches = []
        // this.touchStart = {};
        // this.lastTouch = {};
        this.touchStartTime = 0;
        this.rightTouchStartTime = 0;
        this.positionX = window.innerWidth / 2 | 0;
        this.positionY = window.innerHeight / 2 | 0;
        this.first = true;
        // this.firstTouchId = null;
        // this.secondTouchId = null;
        this.leftDown = false;
        this.rightDown = false;
        this.lastTouch = {}
        this.lastTouchEnd = 0;
        this.touchEnabled = false;

        window.document.addEventListener('touchstart', (e) => {
            if (!this.touchEnabled) return;
            //e.preventDefault();
            const currTouches = Array.from(e.changedTouches);
            for (let i = 0; i < currTouches.length; i++) {
                const touch = currTouches[i];
                let found = false;
                for (let j = 0; j < this.touches.length; j++) {
                    if (this.touches[j].identifier === touch.identifier) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    // First touch event
                    if (this.first) {
                        this.first = false;
                        this.simulateMouseEvent('mousemove', 1, 1, 0);
                    }
                    this.touches.push(touch);
                    // console.log(touch.clientX + ", " + touch.clientY);
                    this.lastTouch[touch.identifier] = { x: touch.clientX, y: touch.clientY };
                    if (this.touches.length === 1) {
                        this.touchStartTime = Date.now();
                    }
                    if (this.touches.length > 1) {
                        this.touchStartTime = 0;
                        if (this.touches.length === 2) {
                            this.rightTouchStartTime = Date.now();
                        } else if (this.touches.length > 2) {
                            this.rightTouchStartTime = 0;
                        }
                    }
                }
            }
            // console.log(this.touches);
            // console.log(this.lastTouch)
        }, { passive: true });

        window.document.addEventListener('touchmove', (e) => {
            if (!this.touchEnabled) return;
            //e.preventDefault();
            if (this.touches.length === 0) return;
            const currTouches = Array.from(e.changedTouches);
            for (let i = 0; i < currTouches.length; i++) {
                const touch = currTouches[i];
                if (touch.identifier === this.touches[0].identifier) {
                    // Move the cursor relative to the last touch position (delta movement)
                    const lastTouch = this.lastTouch[touch.identifier];
                    const dx = touch.clientX - lastTouch.x;
                    const dy = touch.clientY - lastTouch.y;

                    // Update last touch position to the current position
                    this.lastTouch[touch.identifier] = { x: touch.clientX, y: touch.clientY };

                    // Simulate mouse movement
                    this.simulateMouseEvent('mousemove', dx, dy);
                    break;
                } else {
                    // Update last touch position to the current position
                    this.lastTouch[touch.identifier] = { x: touch.clientX, y: touch.clientY };
                }
            }

            if (this.touches.length === 2) {
                if (!this.leftDown) {
                    this.leftDown = true;
                    this.simulateMouseEvent('mousedown', 0, 0, 0);
                }
            } else if (this.touches.length === 3) {
                if (!this.leftDown && !this.rightDown) {
                    this.rightDown = true;
                    this.simulateMouseEvent('mousedown', 0, 0, 0);
                }
            }
        }, { passive: true });

        window.document.addEventListener('touchend', (e) => {
            if (!this.touchEnabled) return;
            const currTouches = Array.from(e.changedTouches);
            const removedTouches = {};

            for (let i = 0; i < currTouches.length; i++) {
                const touch = currTouches[i];
                for (let j = 0; j < this.touches.length; j++) {
                    if (this.touches[j].identifier === touch.identifier) {
                        removedTouches[touch.identifier] = true;
                        break;
                    }
                }
            }

            // console.log(removedTouches)
            const updatedTouches = [];
            for (let i = 0; i < this.touches.length; i++) {
                const touch = this.touches[i];
                if (!removedTouches[touch.identifier]) {
                    updatedTouches.push(touch);
                } else {
                    delete this.lastTouch[touch.identifier];
                }
            }

            this.touches = updatedTouches;

            if (this.touches.length === 0) {
                if (this.leftDown) {
                    this.simulateMouseEvent('mouseup', 0, 0, 0);
                    this.leftDown = false;
                } else if (this.rightDown) {
                    this.simulateMouseEvent('mouseup', 0, 0, 0);
                    this.rightDown = false;
                }
                const timeDiff = Date.now() - this.touchStartTime;
                if (timeDiff < 200) {
                    this.emulator.touchClick |= this.emulator.MOUSE_LEFT;
                    this.touchStartTime = 0;
                }
            } else if (this.touches.length === 1) {
                const timeDiff = Date.now() - this.rightTouchStartTime;
                if (timeDiff < 200) {
                    this.emulator.touchClick |= this.emulator.MOUSE_RIGHT;
                    this.rightTouchStartTime = 0;
                }
            }

            // console.log(this.touches);
            // console.log(this.lastTouch)
        }, { passive: true });
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
            button: this.leftDown ? 0 : this.rightDown ? 2 : undefined,
            buttons: this.leftDown ? 0 : this.rightDown ? 2 : undefined
        }

        const mouseEvent = new MouseEvent(type, e);
        window.document.dispatchEvent(mouseEvent);
    }

    setTouchEnabled(val) {
        if (val) {
            setTimeout(() => {
                this.touchEnabled = true;
            }, 1000);
        } else {
            this.touchEnabled = false;
        }
    }
}


