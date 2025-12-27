const SDK = globalThis.SDK;
export default function (parentClass) {
  return class extends parentClass {
    constructor(sdkPlugin, iObjectType) {
      super(sdkPlugin, iObjectType);
      this._mouseX = 0;
      this._mouseY = 0;
      this._mouseMoveHandler = null;
      this._mouseListenerRefs = 0;
    }

    // Register an instance to use mouse tracking
    RegisterMouseListener() {
      this._mouseListenerRefs++;

      // Only create the event listener if this is the first reference
      if (this._mouseListenerRefs === 1 && !this._mouseMoveHandler) {
        this._mouseMoveHandler = (e) => {
          this._mouseX = e.clientX;
          this._mouseY = e.clientY;
        };
        document.addEventListener("pointermove", this._mouseMoveHandler);
      }
    }

    // Unregister an instance from mouse tracking
    UnregisterMouseListener() {
      this._mouseListenerRefs--;

      // Only remove the event listener if there are no more references
      if (this._mouseListenerRefs <= 0 && this._mouseMoveHandler) {
        document.removeEventListener("pointermove", this._mouseMoveHandler);
        this._mouseMoveHandler = null;
        this._mouseListenerRefs = 0;
      }
    }

    // Get current mouse position
    GetMouseX() {
      return this._mouseX;
    }

    GetMouseY() {
      return this._mouseY;
    }
  };
}
