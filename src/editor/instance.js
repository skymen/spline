export default function (instanceClass) {
  return class extends instanceClass {
    constructor(sdkType, inst) {
      super(sdkType, inst);
      this._layoutView = null;
    }

    Release() {
      // Unregister from type's mouse tracking
      this._sdkType.UnregisterMouseListener();
    }

    OnCreate() {
      // Register with type's mouse tracking
      this._sdkType.RegisterMouseListener();
    }

    Draw(iRenderer, iDrawParams) {
      const texture = this.GetTexture();
      const layoutView = iDrawParams.GetLayoutView();
      this._layoutView = layoutView;

      // Get mouse position relative to this instance's layout view
      const mousePos = this.GetLocalMousePosition();

      // Get quad and convert to device coordinates
      const quad = this._inst.GetQuad();
      const tlx = layoutView.LayoutToClientDeviceX(quad.getTlx());
      const tly = layoutView.LayoutToClientDeviceY(quad.getTly());
      const trx = layoutView.LayoutToClientDeviceX(quad.getTrx());
      const try_ = layoutView.LayoutToClientDeviceY(quad.getTry());
      const brx = layoutView.LayoutToClientDeviceX(quad.getBrx());
      const bry = layoutView.LayoutToClientDeviceY(quad.getBry());
      const blx = layoutView.LayoutToClientDeviceX(quad.getBlx());
      const bly = layoutView.LayoutToClientDeviceY(quad.getBly());

      // Check if mouse is inside the quad
      const isMouseInside = this.IsPointInQuad(mousePos.x, mousePos.y, [
        [tlx, tly],
        [trx, try_],
        [brx, bry],
        [blx, bly],
      ]);

      if (texture) {
        this._inst.ApplyBlendMode(iRenderer);
        iRenderer.SetTexture(texture);

        // Change color if mouse is inside
        if (isMouseInside) {
          iRenderer.SetColorRgba(1, 0, 0, 1); // Highlight
        } else {
          iRenderer.SetColor(this._inst.GetColor());
        }

        iRenderer.Quad3(this._inst.GetQuad(), this.GetTexRect());
      } else {
        // render placeholder
        iRenderer.SetAlphaBlend();
        iRenderer.SetColorFillMode();

        if (this.HadTextureError()) iRenderer.SetColorRgba(0.25, 0, 0, 0.25);
        else if (isMouseInside)
          iRenderer.SetColorRgba(0.2, 0.2, 0.3, 0.3); // Highlight placeholder
        else iRenderer.SetColorRgba(0, 0, 0.1, 0.1);

        iRenderer.Quad(this._inst.GetQuad());
      }

      // Draw square at mouse position using device coordinates
      layoutView.SetDeviceTransform(iRenderer);
      iRenderer.SetAlphaBlend();
      iRenderer.SetColorFillMode();
      iRenderer.SetColorRgba(1, 0, 0, 0.5); // Red square with transparency

      const squareSize = 10;
      iRenderer.Quad2(
        mousePos.x - squareSize,
        mousePos.y - squareSize,
        mousePos.x + squareSize,
        mousePos.y - squareSize,
        mousePos.x + squareSize,
        mousePos.y + squareSize,
        mousePos.x - squareSize,
        mousePos.y + squareSize
      );

      layoutView.SetDefaultTransform(iRenderer);

      // Keep refreshing to track mouse movement
      layoutView.Refresh();
    }

    GetTexture() {
      const image = this.GetObjectType().GetImage();
      return super.GetTexture(image);
    }

    IsOriginalSizeKnown() {
      return true;
    }

    GetOriginalWidth() {
      return this.GetObjectType().GetImage().GetWidth();
    }

    GetOriginalHeight() {
      return this.GetObjectType().GetImage().GetHeight();
    }

    OnMakeOriginalSize() {
      const image = this.GetObjectType().GetImage();
      this._inst.SetSize(image.GetWidth(), image.GetHeight());
    }

    HasDoubleTapHandler() {
      return true;
    }

    OnDoubleTap() {
      this.GetObjectType().EditImage();
    }

    OnPlacedInLayout() {
      // Initialise to size of image
      this.OnMakeOriginalSize();
    }

    OnPropertyChanged(id, value) {}

    // Get mouse position relative to this instance's layout view
    GetLocalMousePosition() {
      const objectType = this._sdkType;
      const mouseX = objectType.GetMouseX();
      const mouseY = objectType.GetMouseY();

      if (!this._layoutView) {
        return { x: mouseX, y: mouseY };
      }

      const layoutName = this._layoutView.GetLayout().GetName();

      // Find the .layoutViewPane that contains a .pane-caption-text with the layout name
      const layoutPanes = document.querySelectorAll(".layoutViewPane");
      let targetPane = null;

      for (const pane of layoutPanes) {
        const captionText = pane.querySelector(".pane-caption-text");
        if (captionText && captionText.textContent.trim() === layoutName) {
          targetPane = pane.querySelector(".layoutView");
          break;
        }
      }

      if (targetPane) {
        const rect = targetPane.getBoundingClientRect();
        return {
          x: mouseX - rect.left,
          y: mouseY - rect.top,
        };
      }

      return { x: mouseX, y: mouseY };
    }

    // Helper method to check if a point is inside a quad
    IsPointInQuad(x, y, vertices) {
      // Use ray casting algorithm to check if point is inside polygon
      // Count intersections with edges
      let inside = false;

      for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const xi = vertices[i][0],
          yi = vertices[i][1];
        const xj = vertices[j][0],
          yj = vertices[j][1];

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }

      return inside;
    }
  };
}
