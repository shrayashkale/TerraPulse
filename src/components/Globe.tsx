// ─── TerraPulse globe: CesiumJS + NASA GIBS (no token needed) ─────────
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

declare global {
  interface Window { Cesium?: any }
}

export interface GlobeHandle {
  flyTo: (lat: number, lon: number, height?: number) => void;
}

interface Props {
  onFocusChange: (lat: number, lon: number, height: number) => void;
}

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi';

const Globe = forwardRef<GlobeHandle, Props>(({ onFocusChange }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
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

    // NASA GIBS: VIIRS true-color day imagery (HD, deep zoom, no key).
    // Verified against the live GetCapabilities: TileMatrixSet "250m",
    // matrices 0-8, PNG. (Wrong IDs/formats = blank blue globe.)
    const gibs = (layer: string, format: string) =>
      new C.WebMapTileServiceImageryProvider({
        url: GIBS, layer, style: 'default', format,
        tileMatrixSetID: '250m', maximumLevel: 8,
        credit: new C.Credit('NASA GIBS'),
      });
    viewer.imageryLayers.addImageryProvider(
      gibs('VIIRS_SNPP_CorrectedReflectance_TrueColor', 'image/png'),
    );
    // Borders + place labels overlay (transparent)
    for (const layer of ['Reference_Features', 'Reference_Labels']) {
      viewer.imageryLayers.addImageryProvider(gibs(layer, 'image/png'));
    }

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
