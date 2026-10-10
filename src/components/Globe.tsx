// ─── TerraPulse globe: CesiumJS + NASA GIBS (no token needed) ─────────
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

declare global {
  interface Window { Cesium?: any }
}

export interface GlobeHandle {
  flyTo: (lat: number, lon: number, height?: number) => void;
  setLabel: (text: string | null, lat?: number, lon?: number) => void;
  dropPin: (lat: number, lon: number, text: string) => void;
}

interface Props {
  onFocusChange: (lat: number, lon: number, height: number) => void;
}

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// draw a map-pin icon on a canvas → data URL for the billboard
function makePin(color: string): string {
  const c = document.createElement('canvas');
  c.width = 68; c.height = 88;
  const x = c.getContext('2d')!;
  x.fillStyle = color;
  x.strokeStyle = '#060b16';
  x.lineWidth = 4;
  // pointer first (circle covers its top edge)
  x.beginPath();
  x.moveTo(16, 46); x.lineTo(52, 46); x.lineTo(34, 82); x.closePath();
  x.fill(); x.stroke();
  // head
  x.beginPath();
  x.arc(34, 30, 24, 0, Math.PI * 2);
  x.fill(); x.stroke();
  // hole
  x.fillStyle = '#060b16';
  x.beginPath();
  x.arc(34, 30, 10, 0, Math.PI * 2);
  x.fill();
  return c.toDataURL();
}

// (re)draw the pinned place-name label entity
function applyLabel(C: any, v: any, labelRef: { current: any }, p: { text: string; lat: number; lon: number }) {
  const pos = C.Cartesian3.fromDegrees(p.lon, p.lat, 1500);
  let ent = labelRef.current;
  if (!ent) {
    ent = v.entities.add({
      position: pos,
      point: {
        pixelSize: 9,
        color: C.Color.fromCssColorString('#22d3ee'),
        outlineColor: C.Color.WHITE, outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: p.text,
        font: '700 15px system-ui, sans-serif',
        fillColor: C.Color.WHITE,
        outlineColor: C.Color.fromCssColorString('#060b16'),
        outlineWidth: 4,
        style: C.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new C.Cartesian2(0, -30),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new C.NearFarScalar(2e5, 1.15, 1.2e7, 0.65),
      },
    });
    labelRef.current = ent;
  } else {
    ent.position = pos;
    ent.label.text = p.text;
  }
}

const Globe = forwardRef<GlobeHandle, Props>(({ onFocusChange }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const labelRef = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const pendingLabel = useRef<{ text: string; lat: number; lon: number } | null>(null);
  const cbRef = useRef(onFocusChange);
  cbRef.current = onFocusChange;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lon: number, height = 600_000) {
      const C = window.Cesium;
      const v = viewerRef.current;
      if (!C || !v) return;
      v.camera.flyTo({
        destination: C.Cartesian3.fromDegrees(lon, lat, height),
        duration: 2.4,
        easingFunction: C.EasingFunction.CUBIC_IN_OUT,
      });
    },
    setLabel(text: string | null, lat?: number, lon?: number) {
      const C = window.Cesium;
      const v = viewerRef.current;
      if (!text || lat === undefined || lon === undefined) {
        pendingLabel.current = null;
        if (v && labelRef.current) { v.entities.remove(labelRef.current); labelRef.current = null; }
        return;
      }
      // viewer may not be ready yet — stash it, applied on init
      pendingLabel.current = { text, lat, lon };
      if (!C || !v) return;
      applyLabel(C, v, labelRef, pendingLabel.current);
    },
    dropPin(lat: number, lon: number, text: string) {
      const C = window.Cesium;
      const v = viewerRef.current;
      if (!C || !v) return;
      if (pinRef.current) { v.entities.remove(pinRef.current); pinRef.current = null; }
      pinRef.current = v.entities.add({
        position: C.Cartesian3.fromDegrees(lon, lat, 800),
        billboard: {
          image: makePin('#f59e0b'),
          width: 34, height: 44,
          verticalOrigin: C.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text,
          font: '700 13px system-ui, sans-serif',
          fillColor: C.Color.WHITE,
          outlineColor: C.Color.fromCssColorString('#060b16'),
          outlineWidth: 4,
          style: C.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new C.Cartesian2(0, -52),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    },
  }));

  useEffect(() => {
    if (!window.Cesium) { setFailed(true); return; }
    const C = window.Cesium;
    const el = divRef.current;
    if (!el) return;

    const viewer = new C.Viewer(el, {
      animation: false, baseLayerPicker: false, fullscreenButton: false,
      geocoder: false, homeButton: false, infoBox: false,
      sceneModePicker: false, selectionIndicator: false,
      timeline: false, navigationHelpButton: false,
      imageryProvider: false, // we add NASA GIBS manually
      creditContainer: document.createElement('div'),
    });
    viewerRef.current = viewer;
    viewer.scene.globe.enableLighting = false;
    viewer.scene.skyAtmosphere.show = true;
    (viewer.scene as any).globe.baseColor = C.Color.fromCssColorString('#060b16');

    // Esri World Imagery: sharp HD satellite down to street level (z0-19),
    // no key needed. This is the Google-Earth-like base.
    viewer.imageryLayers.addImageryProvider(
      new C.UrlTemplateImageryProvider({
        url: ESRI,
        maximumLevel: 19,
        credit: new C.Credit('Esri, Maxar, Earthstar Geographics'),
      }),
    );
    // Seamless ambient labels, keyless, same provider as the base:
    // place names + boundaries, and roads/street names at deep zoom.
    // (CARTO now watermarks without an API key — Esri's own reference
    // overlays are designed for exactly this satellite base.)
    for (const ref of ['World_Boundaries_and_Places', 'World_Transportation']) {
      viewer.imageryLayers.addImageryProvider(
        new C.UrlTemplateImageryProvider({
          url: `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/${ref}/MapServer/tile/{z}/{y}/{x}`,
          maximumLevel: 19,
          credit: new C.Credit('Esri, HERE, Garmin, OpenStreetMap contributors'),
        }),
      );
    }

    // apply any label that arrived before the viewer was ready
    if (pendingLabel.current) applyLabel(C, viewer, labelRef, pendingLabel.current);

    // Start: whole earth, slight tilt for drama
    viewer.camera.setView({
      destination: C.Cartesian3.fromDegrees(20, 20, 22_000_000),
    });

    let timer: ReturnType<typeof setTimeout> | null = null;
    const emit = () => {
      const cam = viewer.camera;
      const h = cam.positionCartographic.height;
      // what point on earth is at screen center?
      const center2d = new C.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2);
      const picked = cam.pickEllipsoid(center2d, viewer.scene.globe.ellipsoid);
      let carto;
      if (picked) {
        carto = C.Cartographic.fromCartesian(picked);
      } else {
        carto = cam.positionCartographic; // looking at space — use sub-camera point
      }
      cbRef.current(
        (carto.latitude * 180) / Math.PI,
        (carto.longitude * 180) / Math.PI,
        h,
      );
    };
    viewer.camera.moveEnd.addEventListener(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(emit, 700); // settle, then report
    });
    // initial report once tiles start loading
    setTimeout(emit, 2500);

    setReady(true);
    return () => {
      if (timer) clearTimeout(timer);
      try { viewer.destroy(); } catch {}
      viewerRef.current = null;
    };
  }, []);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-ink-950 text-slate-400 text-sm p-8 text-center">
        Couldn't load the 3D engine (Cesium CDN unreachable). Check your connection and reload.
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div ref={divRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
          <p className="text-cyan-400 text-sm animate-agent-thinking">Spinning up the planet…</p>
        </div>
      )}
    </div>
  );
});

export default Globe;
