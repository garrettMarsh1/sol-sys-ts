export const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'q': 81,
    'e': 69,
    'c': 67,
    'z': 90,
    'shift': 16,
    'space': 32,
  };
  
  interface MouseState {
    leftButton: boolean;
    rightButton: boolean;
    mouseXDelta: number;
    mouseYDelta: number;
    mouseX: number;
    mouseY: number;
  }
  
  export default class InputController {
    private target_: HTMLElement | Document;
    private current_: MouseState;
    private previous_: MouseState | null;
    private keys_: { [key: number]: boolean };
    private previousKeys_: { [key: number]: boolean };
  
    constructor(target?: HTMLElement) {
      this.target_ = target || document;
      this.current_ = {
        leftButton: false,
        rightButton: false,
        mouseXDelta: 0,
        mouseYDelta: 0,
        mouseX: 0,
        mouseY: 0,
      };
      this.previous_ = null;
      this.keys_ = {};
      this.previousKeys_ = {};
      this.initialize_();
    }
  
    private initialize_() {
      this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e as MouseEvent), false);
      this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e as MouseEvent), false);
      this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e as MouseEvent), false);
      this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e as KeyboardEvent), false);
      this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e as KeyboardEvent), false);
    }
  
    private onMouseMove_(e: MouseEvent) {
      this.current_.mouseX = e.pageX - window.innerWidth / 2;
      this.current_.mouseY = e.pageY - window.innerHeight / 2;
  
      if (this.previous_ === null) {
        this.previous_ = { ...this.current_ };
      }
  
      this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
      this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
    }
  
    private onMouseDown_(e: MouseEvent) {
      this.onMouseMove_(e);
  
      switch (e.button) {
        case 0:
          this.current_.leftButton = true;
          break;
        case 2:
          this.current_.rightButton = true;
          break;
      }
    }
  
    private onMouseUp_(e: MouseEvent) {
      this.onMouseMove_(e);
  
      switch (e.button) {
        case 0:
          this.current_.leftButton = false;
          break;
        case 2:
          this.current_.rightButton = false;
          break;
      }
    }
  
    private onKeyDown_(e: KeyboardEvent) {
      this.keys_[e.keyCode] = true;
    }
  
    private onKeyUp_(e: KeyboardEvent) {
      this.keys_[e.keyCode] = false;
    }
  
    key(keyCode: number): boolean {
      return !!this.keys_[keyCode];
    }
  
    isReady(): boolean {
      return this.previous_ !== null;
    }
  
    update(_: number) {
      if (this.previous_ !== null) {
        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
  
        this.previous_ = { ...this.current_ };
      }
    }
  }
  