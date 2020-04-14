import { mat4, vec4 } from "gl-matrix";

const createCamera = (
  initTarget = [0, 0],
  initDistance = 1,
  initRotation = 0,
  initViewCenter = [0, 0],
  initScaleBounds = [0, Infinity]
) => {
  // Scratch variables
  const scratch0 = new Float32Array(16);
  const scratch1 = new Float32Array(16);
  const scratch2 = new Float32Array(16);

  let view = mat4.create();
  console.log('FUCK', initViewCenter)
  let viewCenter = [...initViewCenter.slice(0, 2), 0, 1];

  const scaleBounds = [...initScaleBounds];

  const getRotation = () => Math.acos(view[0]);

  const getScaling = () => mat4.getScaling(scratch0, view)[0];

  const getScaleBounds = () => [...scaleBounds];

  const getDistance = () => 1 / getScaling();

  const getTranslation = () => mat4.getTranslation(scratch0, view).slice(0, 2);

  const getTarget = () =>
    vec4
      .transformMat4(scratch0, viewCenter, mat4.invert(scratch2, view))
      .slice(0, 2);

  const getView = () => view;

  const getViewCenter = () => viewCenter.slice(0, 2);

  const lookAt = ([x = 0, y = 0] = [], newDistance = 1, newRotation = 0) => {
    // Reset the view
    view = mat4.create();

    translate([-x, -y]);
    rotate(newRotation);
    scale(1 / newDistance);
  };

  const translate = ([x = 0, y = 0] = []) => {
    scratch0[0] = x;
    scratch0[1] = y;
    scratch0[2] = 0;

    const t = mat4.fromTranslation(scratch1, scratch0);

    // Translate about the viewport center
    // This is identical to `i * t * i * view` where `i` is the identity matrix
    mat4.multiply(view, t, view);
  };

  const scale = (d, mousePos) => {
    if (d <= 0) return;

    const scale = getScaling();
    const newScale = scale * d;

    d = Math.max(scaleBounds[0], Math.min(newScale, scaleBounds[1])) / scale;

    if (d === 1) return; // There is nothing to do

    scratch0[0] = d;
    scratch0[1] = d;
    scratch0[2] = 1;

    const s = mat4.fromScaling(scratch1, scratch0);

    const scaleCenter = mousePos ? [...mousePos, 0] : viewCenter;
    const a = mat4.fromTranslation(scratch0, scaleCenter);

    // Translate about the scale center
    // I.e., the mouse position or the view center
    mat4.multiply(
      view,
      a,
      mat4.multiply(
        view,
        s,
        mat4.multiply(view, mat4.invert(scratch2, a), view)
      )
    );
  };

  const rotate = rad => {
    const r = mat4.create();
    mat4.fromRotation(r, rad, [0, 0, 1]);

    // Rotate about the viewport center
    // This is identical to `i * r * i * view` where `i` is the identity matrix
    mat4.multiply(view, r, view);
  };

  const setScaleBounds = newBounds => {
    scaleBounds[0] = newBounds[0];
    scaleBounds[1] = newBounds[1];
  };

  const setView = newView => {
    if (!newView || newView.length < 16) return;
    view = newView;
  };

  const setViewCenter = newViewCenter => {
    viewCenter = [...newViewCenter.slice(0, 2), 0, 1];
  };

  const reset = () => {
    lookAt(initTarget, initDistance, initRotation);
  };

  // Init
  lookAt(initTarget, initDistance, initRotation);

  return {
    get translation() {
      return getTranslation();
    },
    get target() {
      return getTarget();
    },
    get scaling() {
      return getScaling();
    },
    get scaleBounds() {
      return getScaleBounds();
    },
    get distance() {
      return getDistance();
    },
    get rotation() {
      return getRotation();
    },
    get view() {
      return getView();
    },
    get viewCenter() {
      return getViewCenter();
    },
    lookAt,
    translate,
    pan: translate,
    rotate,
    scale,
    zoom: scale,
    reset,
    set: (...args) => {
      console.warn("Deprecated. Please use `setView()` instead.");
      return setView(...args);
    },
    setScaleBounds,
    setView,
    setViewCenter
  };
};



const dom2dCamera = (
  element,
  {
    distance = 1.0,
    target = [0, 0],
    rotation = 0,
    isNdc = true,
    isFixed = false,
    isPan = true,
    panSpeed = 1,
    isRotate = true,
    rotateSpeed = 1,
    isZoom = true,
    zoomSpeed = 1,
    scaleBounds = null,
    onKeyDown = () => {},
    onKeyUp = () => {},
    onMouseDown = () => {},
    onMouseUp = () => {},
    onMouseMove = () => {},
    onWheel = () => {}
  } = {}
) => {
  let camera = createCamera(
    target,
    distance,
    rotation
  );
  let isChanged = false;
  let mouseX = 0;
  let mouseY = 0;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let isLeftMousePressed = false;
  let yScroll = 0;

  let top = 0;
  let left = 0;
  let width = 1;
  let height = 1;
  let aspectRatio = 1;
  let isAlt = false;

  const transformPanX = isNdc
    ? dX => (dX / width) * 2 * aspectRatio // to normalized device coords
    : dX => dX;
  const transformPanY = isNdc
    ? dY => (dY / height) * 2 // to normalized device coords
    : dY => -dY;

  const transformScaleX = isNdc
    ? x => (-1 + (x / width) * 2) * aspectRatio // to normalized device coords
    : x => x;
  const transformScaleY = isNdc
    ? y => 1 - (y / height) * 2 // to normalized device coords
    : y => y;

  const tick = () => {
    if (isFixed) return false;

    isChanged = false;

    if (isPan && isLeftMousePressed && !isAlt) {
      // To pan 1:1 we need to half the width and height because the uniform
      // coordinate system goes from -1 to 1.
      camera.pan([
        transformPanX(panSpeed * (mouseX - prevMouseX)),
        transformPanY(panSpeed * (prevMouseY - mouseY))
      ]);
      isChanged = true;
    }

    if (isZoom && yScroll) {
      const dZ = zoomSpeed * Math.exp(yScroll / height);

      // Get normalized device coordinates (NDC)
      const transformedX = transformScaleX(mouseX);
      const transformedY = transformScaleY(mouseY);

      camera.scale(1 / dZ, [transformedX, transformedY]);

      isChanged = true;
    }

    if (isRotate && isLeftMousePressed && isAlt) {
      const wh = width / 2;
      const hh = height / 2;
      const x1 = prevMouseX - wh;
      const y1 = hh - prevMouseY;
      const x2 = mouseX - wh;
      const y2 = hh - mouseY;
      // Angle between the start and end mouse position with respect to the
      // viewport center
      const radians = vec2.angle([x1, y1], [x2, y2]);
      // Determine the orientation
      const cross = x1 * y2 - x2 * y1;

      camera.rotate(rotateSpeed * radians * Math.sign(cross));

      isChanged = true;
    }

    // Reset scroll delta and mouse position
    yScroll = 0;
    prevMouseX = mouseX;
    prevMouseY = mouseY;

    return isChanged;
  };

  const config = ({
    isFixed: newIsFixed = null,
    isPan: newIsPan = null,
    isRotate: newIsRotate = null,
    isZoom: newIsZoom = null,
    panSpeed: newPanSpeed = null,
    rotateSpeed: newRotateSpeed = null,
    zoomSpeed: newZoomSpeed = null
  } = {}) => {
    isFixed = newIsFixed !== null ? newIsFixed : isFixed;
    isPan = newIsPan !== null ? newIsPan : isPan;
    isRotate = newIsRotate !== null ? newIsRotate : isRotate;
    isZoom = newIsZoom !== null ? newIsZoom : isZoom;
    panSpeed = +newPanSpeed > 0 ? newPanSpeed : panSpeed;
    rotateSpeed = +newRotateSpeed > 0 ? newRotateSpeed : rotateSpeed;
    zoomSpeed = +newZoomSpeed > 0 ? newZoomSpeed : zoomSpeed;
  };

  const refresh = () => {
    const bBox = element.getBoundingClientRect();
    top = bBox.top;
    left = bBox.left;
    width = bBox.width;
    height = bBox.height;
    aspectRatio = width / height;
  };

  const keyUpHandler = event => {
    isAlt = false;

    onKeyUp(event);
  };

  const keyDownHandler = event => {
    isAlt = event.altKey;

    onKeyDown(event);
  };

  const mouseUpHandler = event => {
    isLeftMousePressed = false;

    onMouseUp(event);
  };

  const mouseDownHandler = event => {
    isLeftMousePressed = event.buttons === 1;

    onMouseDown(event);
  };

  const mouseMoveHandler = event => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = event.clientX - left;
    mouseY = event.clientY - top;

    onMouseMove(event);
  };

  const wheelHandler = event => {
    event.preventDefault();

    const scale = event.deltaMode === 1 ? 12 : 1;

    yScroll += scale * (event.deltaY || 0);

    onWheel(event);
  };

  const dispose = () => {
    camera = undefined;
    window.removeEventListener("keydown", keyDownHandler);
    window.removeEventListener("keyup", keyUpHandler);
    element.removeEventListener("mousedown", mouseDownHandler);
    window.removeEventListener("mouseup", mouseUpHandler);
    window.removeEventListener("mousemove", mouseMoveHandler);
    element.removeEventListener("wheel", wheelHandler);
  };

  window.addEventListener("keydown", keyDownHandler, { passive: true });
  window.addEventListener("keyup", keyUpHandler, { passive: true });
  element.addEventListener("mousedown", mouseDownHandler, { passive: true });
  window.addEventListener("mouseup", mouseUpHandler, { passive: true });
  window.addEventListener("mousemove", mouseMoveHandler, { passive: true });
  element.addEventListener("wheel", wheelHandler, { passive: false });

  refresh();

  camera.config = config;
  camera.dispose = dispose;
  camera.refresh = refresh;
  camera.tick = tick;

  return camera;
};

export default dom2dCamera;
