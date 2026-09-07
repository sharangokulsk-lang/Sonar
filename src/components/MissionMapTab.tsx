// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Search,
  Sliders,
  Radio,
  Volume2,
  VolumeX,
  Sparkles,
  AlertTriangle,
  Anchor,
  Navigation,
  CheckCircle2,
  Eye,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Plus,
  MapPin,
  Flame,
  Ship,
  Box,
  Disc,
  Globe,
  Split,
  Satellite,
  ShieldAlert,
  Key,
} from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { SonarScan } from '../types';
import { OperatorProfile } from '../App';

export interface OceanObject {
  id: string;
  name: string;
  category: 'Marine Debris' | 'Ghost Gear' | 'Wreckage / Cargo' | 'Industrial' | 'Natural Feature' | 'Unidentified';
  subType: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  depthM: number;
  reliefHeightM: number;
  shadowLengthM: number;
  backscatterRatio: number;
  dimensions: string;
  lat: number;
  lon: number;
  xMeters: number; // local sector relative offset in meters
  yMeters: number;
  isDiscovered: boolean;
  isInspected: boolean;
  aiVerdict?: string;
  hazards?: string[];
  status: 'PENDING' | 'CONFIRMED' | 'GROUND_TRUTHED' | 'CLEARED';
}

export interface OceanSector {
  id: string;
  name: string;
  basin: string;
  centerLat: number;
  centerLon: number;
  meanDepthM: number;
  depthRange: [number, number];
  surveyVessel: string;
  carrierFreqKhz: number;
  description: string;
  objects: OceanObject[];
}

interface MissionMapTabProps {
  onNavigate: (tab: any, options?: { scanId?: string; targetId?: string }) => void;
  onSelectScan?: (scanId: string) => void;
  scans?: SonarScan[];
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  operator?: OperatorProfile;
}

// Pre-configured Ocean Sectors representing realistic hydrographic survey sites
const OCEAN_SECTORS: OceanSector[] = [
  {
    id: 'bay-of-bengal',
    name: 'Bay of Bengal Shelf Transect',
    basin: 'Indian Ocean / Northern Shelf',
    centerLat: 13.0841,
    centerLon: 80.2782,
    meanDepthM: 32.5,
    depthRange: [18, 95],
    surveyVessel: 'RV Sagar Nidhi / AUV-MAYUR-03',
    carrierFreqKhz: 450,
    description: 'High-density coastal shipping transect with mixed industrial debris, lost containers, and active ghost gear.',
    objects: [
      {
        id: 'ANM-01',
        name: 'Sunken 40ft Shipping Container',
        category: 'Wreckage / Cargo',
        subType: 'ISO Intermodal Steel Container',
        priority: 'CRITICAL',
        confidence: 94.2,
        depthM: 28.6,
        reliefHeightM: 2.6,
        shadowLengthM: 4.8,
        backscatterRatio: 3.8,
        dimensions: '12.2m x 2.4m x 2.6m',
        lat: 13.0844,
        lon: 80.2785,
        xMeters: 45,
        yMeters: -30,
        isDiscovered: true,
        isInspected: true,
        aiVerdict: 'Rigid metallic container obstacle elevated 2.6m above benthic sediment. Specular backscatter confirms ferrous cladding. Poses severe collision hazard to shallow draft traffic.',
        hazards: ['Navigational collision', 'Possible hazardous cargo leakage', 'Trawl snag risk'],
        status: 'CONFIRMED',
      },
      {
        id: 'ANM-02',
        name: 'Entangled Commercial Trawl Net',
        category: 'Ghost Gear',
        subType: 'Polyethylene Mesh with Leadline',
        priority: 'HIGH',
        confidence: 88.5,
        depthM: 24.2,
        reliefHeightM: 1.4,
        shadowLengthM: 2.8,
        backscatterRatio: 2.7,
        dimensions: '18.5m x 8.2m',
        lat: 13.0838,
        lon: 80.2778,
        xMeters: -55,
        yMeters: 25,
        isDiscovered: true,
        isInspected: false,
        aiVerdict: 'Chaotic fibrous acoustic impedance with diffuse backscatter consistent with synthetic ghost fishing net. Smothers benthic habitat.',
        hazards: ['Marine fauna entanglement', 'ROV tether foul', 'Propeller fouling'],
        status: 'PENDING',
      },
      {
        id: 'ANM-03',
        name: 'Corroded Industrial Drums Cluster',
        category: 'Industrial',
        subType: 'Steel Chemical Drums (55 Gal)',
        priority: 'HIGH',
        confidence: 89.2,
        depthM: 29.1,
        reliefHeightM: 1.1,
        shadowLengthM: 1.9,
        backscatterRatio: 3.1,
        dimensions: '3.4m x 2.1m',
        lat: 13.0847,
        lon: 80.2792,
        xMeters: 110,
        yMeters: 60,
        isDiscovered: true,
        isInspected: false,
        aiVerdict: 'Cluster of cylindrical steel objects exhibiting high acoustic reflection with sharp acoustic shadow edges. Likely discarded chemical waste.',
        hazards: ['Toxic chemical leakage', 'Heavy metal contamination', 'Sediment pollution'],
        status: 'CONFIRMED',
      },
      {
        id: 'ANM-04',
        name: 'Granite Seamount Pinnacle',
        category: 'Natural Feature',
        subType: 'Bedrock Granite Outcrop',
        priority: 'LOW',
        confidence: 76.0,
        depthM: 21.0,
        reliefHeightM: 3.8,
        shadowLengthM: 5.5,
        backscatterRatio: 1.8,
        dimensions: '6.2m x 5.1m',
        lat: 13.0832,
        lon: 80.2771,
        xMeters: -120,
        yMeters: -75,
        isDiscovered: true,
        isInspected: false,
        aiVerdict: 'Natural bathymetric geological relief with coarse acoustic texture. No anthropogenic characteristics identified.',
        hazards: ['Shallow bathymetry grounding risk'],
        status: 'CONFIRMED',
      },
      {
        id: 'ANM-05',
        name: 'Unidentified Submerged Wreckage',
        category: 'Unidentified',
        subType: 'Deep Acoustic Anomaly',
        priority: 'CRITICAL',
        confidence: 68.4,
        depthM: 36.4,
        reliefHeightM: 3.2,
        shadowLengthM: 6.2,
        backscatterRatio: 4.1,
        dimensions: '22.0m x 7.5m',
        lat: 13.0855,
        lon: 80.2801,
        xMeters: 190,
        yMeters: -140,
        isDiscovered: false,
        isInspected: false,
        aiVerdict: 'Uncharted high-relief hull anomaly. Sharp acoustic shadow occlusion suggests sunken barge or coastal vessel section.',
        hazards: ['Uncharted wreck', 'Navigational obstruction', 'Entanglement risk'],
        status: 'PENDING',
      },
      {
        id: 'ANM-06',
        name: 'Severed Subsea Armored Cable',
        category: 'Industrial',
        subType: 'Telecommunications Cable Snag',
        priority: 'MEDIUM',
        confidence: 82.1,
        depthM: 31.8,
        reliefHeightM: 0.5,
        shadowLengthM: 0.9,
        backscatterRatio: 2.9,
        dimensions: '45m linear span',
        lat: 13.0828,
        lon: 80.2798,
        xMeters: 80,
        yMeters: 160,
        isDiscovered: false,
        isInspected: false,
        aiVerdict: 'Linear acoustic trace displaying anchor drag scar across sediment matrix with looped metallic cable exposure.',
        hazards: ['Anchor snagging hazard', 'Infrastructure integrity'],
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'north-sea',
    name: 'North Sea Wreck & Munitions Corridor',
    basin: 'Atlantic / Dogger Bank Shelf',
    centerLat: 54.2154,
    centerLon: 2.8752,
    meanDepthM: 46.0,
    depthRange: [28, 85],
    surveyVessel: 'Surveyor-IV (Dual-Side Sonar)',
    carrierFreqKhz: 900,
    description: 'WWII historic warship wreck sector, submerged aircraft wreckage, and cold-water commercial fishing gear.',
    objects: [
      {
        id: 'NS-01',
        name: 'Historic Freighter Steamship Wreck',
        category: 'Wreckage / Cargo',
        subType: 'Iron-hulled Steam Wreck (1942)',
        priority: 'CRITICAL',
        confidence: 96.5,
        depthM: 48.2,
        reliefHeightM: 6.4,
        shadowLengthM: 14.2,
        backscatterRatio: 4.6,
        dimensions: '68.0m x 11.5m',
        lat: 54.2158,
        lon: 2.8759,
        xMeters: 60,
        yMeters: -40,
        isDiscovered: true,
        isInspected: true,
        aiVerdict: 'Intact cargo steamship resting upright in silty sand. Cargo holds breached with dense metal debris scattering 50m downstream.',
        hazards: ['Heavy navigation obstruction', 'Unexploded historical munitions potential', 'Ghost nets snagged on masts'],
        status: 'CONFIRMED',
      },
      {
        id: 'NS-02',
        name: 'Sunken Aircraft Twin-Engine Fuselage',
        category: 'Wreckage / Cargo',
        subType: 'Aviation Aluminum Alloy',
        priority: 'HIGH',
        confidence: 85.0,
        depthM: 42.0,
        reliefHeightM: 2.1,
        shadowLengthM: 4.1,
        backscatterRatio: 3.4,
        dimensions: '14.0m x 16.5m wingspan',
        lat: 54.2148,
        lon: 2.8741,
        xMeters: -80,
        yMeters: 70,
        isDiscovered: true,
        isInspected: false,
        aiVerdict: 'Cruciform acoustic reflection consistent with downed aircraft airframe. Right wing intact, left engine cowl detached.',
        hazards: ['Aviation heritage site', 'Trawl gear hazard'],
        status: 'PENDING',
      },
      {
        id: 'NS-03',
        name: 'Unexploded Aerial Munition (UXO)',
        category: 'Industrial',
        subType: '500lb Submerged Bomb',
        priority: 'CRITICAL',
        confidence: 91.2,
        depthM: 45.8,
        reliefHeightM: 0.8,
        shadowLengthM: 1.6,
        backscatterRatio: 4.8,
        dimensions: '1.6m x 0.5m',
        lat: 54.2162,
        lon: 2.8768,
        xMeters: 130,
        yMeters: 20,
        isDiscovered: false,
        isInspected: false,
        aiVerdict: 'Cylindrical ferrous body half-buried in mobile sand dunes with characteristic tail fin signature. Critical detonation hazard.',
        hazards: ['Detonation risk', 'Immediate 500m exclusion zone required'],
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'mariana-dropoff',
    name: 'Mariana Deep Continental Dropoff',
    basin: 'Western Pacific / Trench Margin',
    centerLat: 11.3492,
    centerLon: 142.1995,
    meanDepthM: 780.0,
    depthRange: [180, 2400],
    surveyVessel: 'DeepOcean Explorer ROV-11k',
    carrierFreqKhz: 120,
    description: 'Extreme deep abyss dropoff with abyssal plastic accumulations, lost oceanographic moorings, and hydrothermal basalt structures.',
    objects: [
      {
        id: 'DP-01',
        name: 'Deep Oceanic Mooring Array (Lost)',
        category: 'Industrial',
        subType: 'Acoustic Doppler Current Profiler (ADCP)',
        priority: 'HIGH',
        confidence: 92.4,
        depthM: 840.0,
        reliefHeightM: 4.2,
        shadowLengthM: 8.5,
        backscatterRatio: 3.5,
        dimensions: '2.5m tripod with syntactic foam spheres',
        lat: 11.3496,
        lon: 142.2001,
        xMeters: 50,
        yMeters: -50,
        isDiscovered: true,
        isInspected: true,
        aiVerdict: 'Tethered subsurface oceanographic package with glass flotation spheres. Acoustic pinger non-responsive.',
        hazards: ['Entanglement with deep-towed survey sleds', 'High-value equipment recovery target'],
        status: 'CONFIRMED',
      },
      {
        id: 'DP-02',
        name: 'Synthetic Polymer Debris Accumulation',
        category: 'Marine Debris',
        subType: 'Deep Benthic Plastics & Strapping',
        priority: 'MEDIUM',
        confidence: 79.5,
        depthM: 920.0,
        reliefHeightM: 1.2,
        shadowLengthM: 2.1,
        backscatterRatio: 2.2,
        dimensions: '8.0m x 4.5m blanket',
        lat: 11.3488,
        lon: 142.1989,
        xMeters: -70,
        yMeters: 90,
        isDiscovered: false,
        isInspected: false,
        aiVerdict: 'Dense accumulation of synthetic polymers trapped in a bathymetric depression at the canyon base.',
        hazards: ['Microplastic degradation', 'Deep benthic fauna disruption'],
        status: 'PENDING',
      },
    ],
  },
];

export const MissionMapTab: React.FC<MissionMapTabProps> = ({
  onNavigate,
  onShowToast,
  operator,
}) => {
  // Google Maps API Key from environment or runtime injection
  const googleMapsApiKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
    'AIzaSyAHA33mpeDxelbW5SOA36FJdZo8cYRkKX8';
  const hasValidApiKey = Boolean(googleMapsApiKey && googleMapsApiKey.trim().length > 0);
  const [mapAuthError, setMapAuthError] = useState<boolean>(false);

  // Active sector & dataset
  const [selectedSectorId, setSelectedSectorId] = useState<string>('bay-of-bengal');
  const currentSector = OCEAN_SECTORS.find((s) => s.id === selectedSectorId) || OCEAN_SECTORS[0];
  const [sectorObjects, setSectorObjects] = useState<OceanObject[]>(currentSector.objects);

  // View Mode: 'google-maps' | 'sonar-swath' | 'split'
  const [viewMode, setViewMode] = useState<'google-maps' | 'sonar-swath' | 'split'>(
    hasValidApiKey ? 'google-maps' : 'sonar-swath'
  );

  // Intercept Google Maps auth failure callbacks to gracefully handle ApiProjectMapError
  useEffect(() => {
    const win = window as any;
    const prevAuthFailure = win.gm_authFailure;
    win.gm_authFailure = () => {
      console.warn('[Google Maps] gm_authFailure or ApiProjectMapError detected.');
      setMapAuthError(true);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch {
          // ignore
        }
      }
    };
    return () => {
      win.gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Google Maps specific states
  const [googleMapType, setGoogleMapType] = useState<'satellite' | 'hybrid' | 'terrain' | 'roadmap'>('satellite');
  const [googleZoom, setGoogleZoom] = useState<number>(15);
  const [googleCenter, setGoogleCenter] = useState<{ lat: number; lng: number }>({
    lat: currentSector.centerLat,
    lng: currentSector.centerLon,
  });
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // Synchronize sector objects when switching sector
  useEffect(() => {
    setSectorObjects(currentSector.objects);
    setSelectedObjectId(currentSector.objects[0]?.id || null);
    setGoogleCenter({
      lat: currentSector.centerLat,
      lng: currentSector.centerLon,
    });
    setGoogleZoom(15);
    setZoom(3.5);
    setPan({ x: 0, y: 0 });
  }, [selectedSectorId]);

  // Sonar Swath Transformation States
  const [zoom, setZoom] = useState<number>(3.5);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Depth Column Penetration Slider
  const [depthFilterM, setDepthFilterM] = useState<number>(currentSector.meanDepthM + 20);

  // Layer Toggles
  const [showBathymetry, setShowBathymetry] = useState(true);
  const [showSwathTracks, setShowSwathTracks] = useState(true);
  const [showRadarPulse, setShowRadarPulse] = useState(true);
  const [showGridCoordinates, setShowGridCoordinates] = useState(true);

  // Active Selected Object for HUD Deep-Inspection
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(sectorObjects[0]?.id || null);
  const activeObject = sectorObjects.find((o) => o.id === selectedObjectId) || sectorObjects[0];

  // Radar & Sonar Ping Scanning States
  const [isScanningSector, setIsScanningSector] = useState(false);
  const [scanPulseRadius, setScanPulseRadius] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [radarAngle, setRadarAngle] = useState(0);

  // Mouse coordinate readout (Lat/Lon)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; depth: number }>({
    lat: currentSector.centerLat,
    lon: currentSector.centerLon,
    depth: currentSector.meanDepthM,
  });

  // Synthesize acoustic ping sound using Web Audio API
  const playSonarChime = useCallback(
    (pitch = 880) => {
      if (!audioEnabled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.42);
      } catch {
        // Audio autoplay policy fallback
      }
    },
    [audioEnabled]
  );

  // Continuous rotating radar sweep effect
  useEffect(() => {
    if (!showRadarPulse) return;
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 1.2) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [showRadarPulse]);

  // Handle "Scan Ocean Sector / Sonar Ping" Action
  const handleScanOceanSector = () => {
    setIsScanningSector(true);
    setScanPulseRadius(0);
    playSonarChime(720);

    let progress = 0;
    const anim = setInterval(() => {
      progress += 12;
      setScanPulseRadius(progress);

      if (progress >= 320) {
        clearInterval(anim);
        setIsScanningSector(false);

        // Discover previously hidden unknown objects in the sector
        setSectorObjects((prev) => {
          let newlyFound = 0;
          const updated = prev.map((obj) => {
            if (!obj.isDiscovered) {
              newlyFound++;
              return { ...obj, isDiscovered: true };
            }
            return obj;
          });

          if (newlyFound > 0) {
            playSonarChime(1120);
            if (onShowToast) {
              onShowToast(
                `Sonar Echo Return: ${newlyFound} unknown submerged contact(s) detected in deep water!`,
                'success'
              );
            }
          } else {
            if (onShowToast) {
              onShowToast('Sector scanned. All contacts acoustic backscatter updated.', 'info');
            }
          }

          return updated;
        });
      }
    }, 30);
  };

  // Zoom into specific target on both Google Maps and Sonar Canvas
  const handleFocusTarget = (obj: OceanObject) => {
    setSelectedObjectId(obj.id);

    // Update Google Maps position & zoom
    setGoogleCenter({ lat: obj.lat, lng: obj.lon });
    setGoogleZoom(18);

    // Update Sonar Canvas pan
    const targetScale = Math.min(zoom * 28, 220);
    setPan({
      x: -obj.xMeters * (targetScale / 35),
      y: -obj.yMeters * (targetScale / 35),
    });
    setZoom(7.5);
    playSonarChime(950);
  };

  // AI Hydroacoustic Deep Scan via Gemini
  const handleAiDeepScan = async (obj: OceanObject) => {
    setIsAiAnalyzing(true);
    playSonarChime(640);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch('/api/analyze-sonar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          scanMeta: {
            filename: `${currentSector.id}_${obj.id}.son`,
            depth: obj.depthM,
            vehicleId: currentSector.surveyVessel,
            frequencyKhz: currentSector.carrierFreqKhz,
          },
          targetDetection: {
            className: obj.name,
            acousticBackscatterRatio: obj.backscatterRatio,
            riskScore: obj.priority === 'CRITICAL' ? 95 : obj.priority === 'HIGH' ? 75 : 45,
            boundingBox: { width: 45, height: 28 },
          },
        }),
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setSectorObjects((prev) =>
          prev.map((o) =>
            o.id === obj.id
              ? {
                  ...o,
                  isInspected: true,
                  aiVerdict: data.summary || o.aiVerdict,
                  hazards: data.recommendedActions || o.hazards,
                }
              : o
          )
        );
        if (onShowToast) {
          const modelTag = data._source?.includes('gemini') ? 'Gemini AI' : 'Hydroacoustic Engine';
          onShowToast(`${modelTag} analysis completed for ${obj.name}.`, 'success');
        }
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.info('Hydroacoustic assessment fallback:', err);
      // Seamless heuristic fallback on client
      setSectorObjects((prev) =>
        prev.map((o) =>
          o.id === obj.id
            ? {
                ...o,
                isInspected: true,
                aiVerdict: `Hydroacoustic analysis confirms rigid specular anomaly (${o.backscatterRatio}x ambient reflection) with a ${o.shadowLengthM}m downstream shadow indicating an elevated obstacle on the benthic seabed.`,
                hazards: o.hazards || ['Navigational obstacle', 'ROV investigation recommended'],
              }
            : o
        )
      );
      if (onShowToast) {
        onShowToast(`Hydroacoustic feature assessment completed for ${obj.name}.`, 'info');
      }
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // Inject a brand new simulated unknown anomaly into the deep ocean
  const handleInjectUnknownAnomaly = (customLat?: number, customLon?: number) => {
    const lat = customLat ?? parseFloat((currentSector.centerLat + (Math.random() - 0.5) * 0.003).toFixed(5));
    const lon = customLon ?? parseFloat((currentSector.centerLon + (Math.random() - 0.5) * 0.003).toFixed(5));
    const randomOffset = (Math.random() - 0.5) * 280;
    const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newId = `ANM-${Date.now().toString().slice(-4)}${uniqueSuffix}`;

    const newObj: OceanObject = {
      id: newId,
      name: 'Uncharted Metallic Contact (Unidentified)',
      category: 'Unidentified',
      subType: 'Deep Acoustic Reflection Void',
      priority: 'CRITICAL',
      confidence: 71.4,
      depthM: parseFloat((currentSector.meanDepthM + (Math.random() - 0.5) * 15).toFixed(1)),
      reliefHeightM: 2.8,
      shadowLengthM: 5.2,
      backscatterRatio: 3.9,
      dimensions: '9.5m x 3.2m',
      lat,
      lon,
      xMeters: Math.round(randomOffset),
      yMeters: Math.round((Math.random() - 0.5) * 200),
      isDiscovered: true,
      isInspected: false,
      aiVerdict: 'Unidentified dense acoustic impedance boundary resting on benthic seabed. Downstream shadow indicates prominent 2.8m relief above local substrate.',
      hazards: ['Uncharted navigation hazard', 'ROV investigation recommended'],
      status: 'PENDING',
    };

    setSectorObjects((prev) => [newObj, ...prev]);
    setSelectedObjectId(newId);
    handleFocusTarget(newObj);
    playSonarChime(1240);

    if (onShowToast) {
      onShowToast(`New contact ${newId} placed at ${newObj.lat}°N, ${newObj.lon}°E.`, 'warn');
    }
  };

  // Render Interactive Bathymetric Ocean Map onto HTML5 Canvas
  useEffect(() => {
    if (viewMode === 'google-maps') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 800;
    const height = canvas.parentElement?.clientHeight || 560;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;

    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.9);
    bgGrad.addColorStop(0, '#061626');
    bgGrad.addColorStop(0.5, '#04101e');
    bgGrad.addColorStop(1, '#020912');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const metersToPx = (zoom * 28) / 35;

    // 1. Bathymetric Depth Contours
    if (showBathymetry) {
      ctx.save();
      ctx.translate(cx, cy);

      const contourRadii = [400, 320, 240, 160, 90, 45];
      const contourDepths = ['80m', '60m', '45m', '32m', '24m', '18m'];

      contourRadii.forEach((r, idx) => {
        const scaledR = r * (metersToPx / 2.5);
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.15) {
          const wobble = Math.sin(a * 4 + idx) * 12 + Math.cos(a * 2) * 8;
          const curR = scaledR + wobble;
          const px = Math.cos(a) * curR;
          const py = Math.sin(a) * curR;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();

        ctx.strokeStyle = `rgba(0, 163, 196, ${0.12 + idx * 0.04})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        if (zoom >= 2.0 && idx % 2 === 0) {
          ctx.font = '9px monospace';
          ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.fillText(`— ${contourDepths[idx]} contour —`, scaledR + 4, 0);
        }
      });
      ctx.restore();
    }

    // 2. Swath Tracks
    if (showSwathTracks) {
      ctx.save();
      ctx.translate(cx, cy);

      const swathLen = 600 * metersToPx;
      const swathWidth = 120 * metersToPx;

      const swathGrad = ctx.createLinearGradient(-swathWidth / 2, 0, swathWidth / 2, 0);
      swathGrad.addColorStop(0, 'rgba(0, 180, 216, 0.04)');
      swathGrad.addColorStop(0.42, 'rgba(0, 180, 216, 0.22)');
      swathGrad.addColorStop(0.5, 'rgba(2, 8, 16, 0.85)');
      swathGrad.addColorStop(0.58, 'rgba(0, 180, 216, 0.22)');
      swathGrad.addColorStop(1, 'rgba(0, 180, 216, 0.04)');

      ctx.fillStyle = swathGrad;
      ctx.fillRect(-swathWidth / 2, -swathLen / 2, swathWidth, swathLen);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(-swathWidth / 2, -swathLen / 2, swathWidth, swathLen);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -swathLen / 2);
      ctx.lineTo(0, swathLen / 2);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Grid
    if (showGridCoordinates) {
      ctx.save();
      ctx.strokeStyle = 'rgba(25, 45, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);

      const gridSpacing = 80;
      for (let x = pan.x % gridSpacing; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = pan.y % gridSpacing; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Radar Ping Pulse
    if (isScanningSector && scanPulseRadius > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.arc(0, 0, scanPulseRadius * (metersToPx / 1.5), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.restore();
    }

    // 5. Rotating Radar
    if (showRadarPulse) {
      ctx.save();
      ctx.translate(cx, cy);
      const radLen = Math.max(width, height) * 0.65;
      const radAngleRad = (radarAngle * Math.PI) / 180;

      const beamGrad = ctx.createLinearGradient(
        0,
        0,
        Math.cos(radAngleRad) * radLen,
        Math.sin(radAngleRad) * radLen
      );
      beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
      beamGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radLen, radAngleRad - 0.25, radAngleRad);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(radAngleRad) * radLen, Math.sin(radAngleRad) * radLen);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }

    // 6. Vessel
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#00a3c4';
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AUV-MAYUR-03', 14, 4);
    ctx.restore();

    // 7. Contacts
    sectorObjects.forEach((obj) => {
      if (obj.depthM > depthFilterM) return;

      const objScreenX = cx + obj.xMeters * metersToPx;
      const objScreenY = cy + obj.yMeters * metersToPx;
      const isSelected = selectedObjectId === obj.id;

      const colorHex =
        obj.priority === 'CRITICAL'
          ? '#ef4444'
          : obj.priority === 'HIGH'
          ? '#f59e0b'
          : obj.priority === 'MEDIUM'
          ? '#06b6d4'
          : '#10b981';

      ctx.save();
      ctx.translate(objScreenX, objScreenY);

      if (!obj.isDiscovered) {
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (zoom >= 5.0) {
        const shadowLengthPx = obj.shadowLengthM * metersToPx;
        const shadowWidthPx = Math.max(10, 8 * metersToPx);

        ctx.fillStyle = 'rgba(1, 4, 8, 0.92)';
        ctx.fillRect(8, -shadowWidthPx / 2, shadowLengthPx, shadowWidthPx);

        ctx.fillStyle =
          obj.priority === 'CRITICAL'
            ? 'rgba(255, 90, 110, 0.75)'
            : 'rgba(0, 229, 255, 0.75)';
        ctx.fillRect(-6, -shadowWidthPx / 2, 14, shadowWidthPx);

        ctx.strokeStyle = colorHex;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeRect(-8, -shadowWidthPx / 2 - 2, shadowLengthPx + 18, shadowWidthPx + 4);

        ctx.font = 'bold 9px monospace';
        const labelText = `${obj.id} • ${obj.name.slice(0, 20)}`;
        ctx.fillStyle = 'rgba(5, 14, 25, 0.9)';
        ctx.fillRect(-8, -shadowWidthPx / 2 - 18, 120, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, -4, -shadowWidthPx / 2 - 7);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = colorHex;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = isSelected ? 16 : 8;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 16 : 10, 0, Math.PI * 2);
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${obj.id}: ${obj.name.slice(0, 16)}`, 12, 4);
      }

      ctx.restore();
    });
  }, [
    viewMode,
    zoom,
    pan,
    depthFilterM,
    showBathymetry,
    showSwathTracks,
    showGridCoordinates,
    showRadarPulse,
    radarAngle,
    isScanningSector,
    scanPulseRadius,
    sectorObjects,
    selectedObjectId,
  ]);

  // Sonar Canvas Event Handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;
    const metersToPx = (zoom * 28) / 35;

    for (const obj of sectorObjects) {
      if (!obj.isDiscovered) continue;
      const objScreenX = cx + obj.xMeters * metersToPx;
      const objScreenY = cy + obj.yMeters * metersToPx;
      const dist = Math.hypot(clickX - objScreenX, clickY - objScreenY);

      if (dist <= 24) {
        handleFocusTarget(obj);
        return;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      const rect = mapContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2 - pan.x;
      const mouseY = e.clientY - rect.top - rect.height / 2 - pan.y;

      const metersPerPixel = 100 / (zoom * 28);
      const xMeters = mouseX * metersPerPixel;
      const yMeters = mouseY * metersPerPixel;

      const latOffset = -yMeters / 111000;
      const lonOffset = xMeters / (111000 * Math.cos((currentSector.centerLat * Math.PI) / 180));

      setCursorCoords({
        lat: parseFloat((currentSector.centerLat + latOffset).toFixed(5)),
        lon: parseFloat((currentSector.centerLon + lonOffset).toFixed(5)),
        depth: parseFloat(currentSector.meanDepthM.toFixed(1)),
      });
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(1.0, Math.min(12.0, parseFloat((prev * zoomFactor).toFixed(2)))));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Header with Ocean Sector Selector & View Switcher */}
      <div className="bg-[#0b1624] border border-[#16293d] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Google Maps Ocean Explorer & Hydroacoustic Scanner
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                Google Maps Platform
              </span>
            </div>
            <p className="text-xs text-[#7d93a8] mt-0.5">
              High-resolution satellite ocean imagery, bathymetric depths, and deep-water acoustic anomaly detection
            </p>
          </div>
        </div>

        {/* Action Controls & Sector Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector Selector */}
          <div className="flex items-center bg-[#08121d] border border-[#182e46] rounded-xl px-3 py-1.5 space-x-2">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none font-medium cursor-pointer"
            >
              {OCEAN_SECTORS.map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-[#0b1624] text-white">
                  {sec.name} ({sec.meanDepthM}m Depth)
                </option>
              ))}
            </select>
          </div>

          {/* Emit Sonar Ping */}
          <button
            id="btn-scan-ocean-sector"
            onClick={handleScanOceanSector}
            disabled={isScanningSector}
            className="bg-gradient-to-r from-[#00a3c4] to-teal-500 hover:from-[#0092b0] hover:to-teal-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-950/50 flex items-center space-x-2 active:scale-[0.99]"
          >
            <Radio className={`w-4 h-4 ${isScanningSector ? 'animate-spin' : ''}`} />
            <span>{isScanningSector ? 'Sweeping...' : 'Emit Sonar Ping'}</span>
          </button>

          {/* Inject Contact */}
          <button
            id="btn-inject-anomaly-map"
            onClick={() => handleInjectUnknownAnomaly()}
            className="bg-[#102338] hover:bg-[#16304c] text-cyan-300 text-xs font-semibold px-3 py-2 rounded-xl border border-cyan-500/30 transition-all flex items-center space-x-1.5"
            title="Deploy a simulated submerged contact at coordinates"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject Contact</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar: Google Map / Acoustic Swath / Split View */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#08121e] border border-[#14263b] rounded-xl px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-[#768d9f]">VIEW MODE:</span>
          <div className="flex rounded-lg bg-[#050c14] p-0.5 border border-[#182c42]">
            <button
              id="btn-view-google-maps"
              onClick={() => setViewMode('google-maps')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'google-maps'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#8da0b3] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps (Satellite Ocean)</span>
              {!hasValidApiKey && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Key Setup
                </span>
              )}
            </button>

            <button
              id="btn-view-sonar-swath"
              onClick={() => setViewMode('sonar-swath')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'sonar-swath'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#8da0b3] hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Acoustic Sonar Swath</span>
              {!hasValidApiKey && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Ready
                </span>
              )}
            </button>

            <button
              id="btn-view-split"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                viewMode === 'split'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-[#8da0b3] hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Dual Split View</span>
            </button>
          </div>
        </div>

        {/* Map Type Selector for Google Maps */}
        {viewMode !== 'sonar-swath' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-[#768d9f]">MAP LAYER:</span>
            <div className="flex rounded-lg bg-[#050c14] p-0.5 border border-[#182c42]">
              {(['satellite', 'hybrid', 'terrain', 'roadmap'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setGoogleMapType(type)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase transition-all ${
                    googleMapType === type
                      ? 'bg-[#152e46] text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-[#768d9f] hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Map Canvas + Inspection HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Column (8 cols or dynamic) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div
            ref={mapContainerRef}
            className="bg-[#070f19] border border-[#16293d] rounded-2xl overflow-hidden relative min-h-[580px] h-[580px] flex flex-col justify-between shadow-2xl"
          >
            {/* GOOGLE MAPS COMPONENT */}
            {(viewMode === 'google-maps' || viewMode === 'split') && (
              <div
                className={`relative w-full ${
                  viewMode === 'split' ? 'h-1/2 border-b border-[#16293d]' : 'h-full'
                }`}
              >
                {hasValidApiKey && !mapAuthError ? (
                  <APIProvider
                    apiKey={googleMapsApiKey}
                    onError={(err) => {
                      console.warn('[Google Maps] APIProvider load error:', err);
                      setMapAuthError(true);
                    }}
                  >
                    <Map
                      id="google-ocean-map"
                      style={{ width: '100%', height: '100%' }}
                      defaultCenter={googleCenter}
                      center={googleCenter}
                      defaultZoom={googleZoom}
                      zoom={googleZoom}
                      mapTypeId={googleMapType}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      onClick={(e) => {
                        if (e.detail?.latLng) {
                          const lat = parseFloat(e.detail.latLng.lat.toFixed(5));
                          const lng = parseFloat(e.detail.latLng.lng.toFixed(5));
                          handleInjectUnknownAnomaly(lat, lng);
                        }
                      }}
                    >
                      {/* Render AdvancedMarkers for Submerged Contacts */}
                      {sectorObjects.map((obj) => {
                        if (!obj.isDiscovered) return null;
                        const isSelected = selectedObjectId === obj.id;
                        const isHovered = hoveredObjectId === obj.id;
                        const pinColor =
                          obj.priority === 'CRITICAL'
                            ? '#ef4444'
                            : obj.priority === 'HIGH'
                            ? '#f59e0b'
                            : '#06b6d4';

                        return (
                          <AdvancedMarker
                            key={obj.id}
                            position={{ lat: obj.lat, lng: obj.lon }}
                            onClick={() => handleFocusTarget(obj)}
                            title={`${obj.id}: ${obj.name}`}
                          >
                            <div
                              onMouseEnter={() => setHoveredObjectId(obj.id)}
                              onMouseLeave={() => setHoveredObjectId(null)}
                              className="relative cursor-pointer group select-none"
                            >
                              {/* Glowing Target Ring */}
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all transform group-hover:scale-125 ${
                                  isSelected
                                    ? 'bg-cyan-500/80 border-white ring-4 ring-cyan-400/50 scale-110'
                                    : 'border-white/90 shadow-lg'
                                }`}
                                style={{
                                  backgroundColor: isSelected ? '#00e5ff' : pinColor,
                                }}
                              >
                                <Anchor className="w-3.5 h-3.5 text-white" />
                              </div>

                              {/* Ping pulse ripple when scanning */}
                              {isScanningSector && (
                                <span
                                  className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-ping opacity-75 pointer-events-none"
                                />
                              )}

                              {/* Target label tooltip */}
                              <div
                                className={`absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow-xl border pointer-events-none z-30 ${
                                  isSelected || isHovered
                                    ? 'bg-slate-900/95 text-white border-cyan-400 block'
                                    : 'hidden group-hover:block bg-slate-900/90 text-slate-200 border-slate-700'
                                }`}
                              >
                                {obj.id}: {obj.name.slice(0, 18)} ({obj.depthM}m)
                              </div>
                            </div>
                          </AdvancedMarker>
                        );
                      })}

                      {/* Active Target InfoWindow Popup */}
                      {activeObject && activeObject.isDiscovered && (
                        <InfoWindow
                          position={{ lat: activeObject.lat, lng: activeObject.lon }}
                          onCloseClick={() => setSelectedObjectId(null)}
                          pixelOffset={[0, -28]}
                        >
                          <div className="p-1 text-slate-900 max-w-xs font-sans">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-bold text-cyan-800 uppercase">
                                {activeObject.id} • {activeObject.category}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  activeObject.priority === 'CRITICAL'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {activeObject.priority}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 mt-1">
                              {activeObject.name}
                            </h4>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Depth: <strong>{activeObject.depthM} m</strong> | Shadow: {activeObject.shadowLengthM}m
                            </div>
                            <p className="text-[11px] text-slate-700 mt-1 leading-tight line-clamp-2">
                              {activeObject.aiVerdict}
                            </p>
                            <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                              <button
                                onClick={() => handleAiDeepScan(activeObject)}
                                className="text-[10px] text-cyan-700 hover:text-cyan-900 font-bold underline"
                              >
                                Analyze with AI
                              </button>
                              <span className="text-[10px] font-mono text-slate-500">
                                {activeObject.confidence.toFixed(1)}% Conf
                              </span>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>

                    {/* Floating Map Hint / Attribution */}
                    <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300">
                      Click ocean on Google Maps to drop a new Sonar Contact Probe
                    </div>
                  </APIProvider>
                ) : (
                  <div className="w-full h-full bg-[#070f19] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
                    {/* Concentric radar grid background motif */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                      <div className="w-96 h-96 rounded-full border border-cyan-500/40" />
                      <div className="w-64 h-64 rounded-full border border-cyan-500/30 absolute" />
                      <div className="w-32 h-32 rounded-full border border-cyan-500/20 absolute" />
                    </div>

                    <div className="relative z-10 max-w-md flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
                        <Globe className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-wide">
                          <Key className="w-3 h-3 text-cyan-400" />
                          <span>
                            {mapAuthError
                              ? 'Google Cloud Project Authorization'
                              : 'Google Maps API Key Setup'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Google Maps Satellite Bathymetry
                        </h3>
                        <p className="text-xs text-[#8da0b3] leading-relaxed">
                          {mapAuthError
                            ? 'Google Maps returned an ApiProjectMapError. Ensure the Maps JavaScript API is enabled in your Google Cloud project and that the key has valid permissions.'
                            : 'Interactive satellite bathymetry and Advanced Markers require a Google Maps Platform key. For quick zero-cost prototyping without a billing account, you can use the free Maps Demo Key.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          id="btn-switch-sonar-swath"
                          onClick={() => setViewMode('sonar-swath')}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-950 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Disc className="w-3.5 h-3.5" />
                          <span>View Acoustic Swath (Ready Now)</span>
                        </button>
                        <a
                          id="link-maps-demo-key"
                          href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0d1e30] hover:bg-[#132a42] text-cyan-300 border border-cyan-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <span>Get Free Demo Key</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </a>
                      </div>

                      <div className="pt-2 text-[10px] font-mono text-[#617b94]">
                        Set <code className="text-cyan-400 bg-[#0b1726] px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY</code> in project secrets
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ACOUSTIC SONAR SWATH CANVAS (Shown in 'sonar-swath' or 'split') */}
            {(viewMode === 'sonar-swath' || viewMode === 'split') && (
              <div
                className={`relative w-full ${
                  viewMode === 'split' ? 'h-1/2' : 'h-full'
                }`}
              >
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  className={`w-full h-full absolute inset-0 cursor-${
                    isDragging ? 'grabbing' : 'crosshair'
                  }`}
                />

                {/* Acoustic Depth & Sonar Zoom Overlay */}
                <div className="absolute top-2 left-2 z-10 flex items-center space-x-2 pointer-events-none">
                  <div className="bg-[#08121d]/90 backdrop-blur-md border border-[#17304b] rounded-xl px-3 py-1 text-xs text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono font-bold text-cyan-400">{zoom.toFixed(1)}x Sonar Swath</span>
                  </div>
                </div>

                {/* Acoustic Depth Filter Slider */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center space-y-2">
                  <button
                    onClick={() => setZoom((prev) => Math.min(12, prev + 0.8))}
                    className="w-8 h-8 bg-[#0b1624]/90 hover:bg-[#122338] text-white border border-[#19324e] rounded-lg flex items-center justify-center shadow-xl active:scale-95"
                    title="Zoom In Sonar"
                  >
                    <ZoomIn className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setZoom((prev) => Math.max(1, prev - 0.8))}
                    className="w-8 h-8 bg-[#0b1624]/90 hover:bg-[#122338] text-white border border-[#19324e] rounded-lg flex items-center justify-center shadow-xl active:scale-95"
                    title="Zoom Out Sonar"
                  >
                    <ZoomOut className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => {
                      setZoom(3.5);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="w-8 h-8 bg-[#0b1624]/90 hover:bg-[#122338] text-white border border-[#19324e] rounded-lg flex items-center justify-center shadow-xl active:scale-95"
                    title="Reset Center"
                  >
                    <Crosshair className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Coordinates & Live Hydrographic Telemetry Bar */}
            <div className="relative z-10 m-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-[#08121d]/90 backdrop-blur-md border border-[#17304b] rounded-xl px-4 py-2 shadow-xl">
              <div className="flex items-center space-x-3 text-[#8fa4b8]">
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-white font-bold">
                    {cursorCoords.lat}° N, {cursorCoords.lon}° E
                  </span>
                </span>
                <span>•</span>
                <span>
                  Mean Depth: <span className="text-cyan-400 font-bold">{currentSector.meanDepthM} m</span>
                </span>
                <span>•</span>
                <span>
                  Vessel: <span className="text-white">{currentSector.surveyVessel}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-[#6c8299]">
                  {sectorObjects.filter((o) => o.isDiscovered).length} / {sectorObjects.length} Contacts Logged
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deep-Inspection HUD & Target Details */}
        <div className="lg:col-span-4 bg-[#0d1b2a] border border-[#16293d] rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-4">
            {/* Header & Priority Badge */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#6c8299] block">
                  TARGET INSPECTION HUD • {activeObject?.id || 'ANM-00'}
                </span>
                <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                  {activeObject?.name || 'No Target Selected'}
                </h2>
                <div className="text-xs text-cyan-400 font-medium">
                  {activeObject?.subType}
                </div>
              </div>

              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  activeObject?.priority === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                    : activeObject?.priority === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {activeObject?.priority} HAZARD
              </span>
            </div>

            {/* Target Miniature Sonar Swath Cutout */}
            <div className="w-full h-28 rounded-xl bg-[#060e18] border border-[#18314c] overflow-hidden relative flex flex-col justify-between p-2.5">
              <div className="absolute inset-0 bg-gradient-to-b from-[#061424] via-[#05111e] to-[#040c16] opacity-90" />

              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="flex items-center space-x-1.5">
                  <div
                    className={`w-14 h-10 rounded border flex items-center justify-center font-mono text-[10px] font-bold shadow-lg ${
                      activeObject?.priority === 'CRITICAL'
                        ? 'bg-rose-500/40 border-rose-400 text-rose-200'
                        : 'bg-cyan-500/40 border-cyan-400 text-cyan-200'
                    }`}
                  >
                    REFLECT
                  </div>
                  <div className="w-20 h-10 bg-black/90 border border-slate-800 rounded flex items-center justify-center font-mono text-[9px] text-[#4d637b]">
                    SHADOW
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#7d93a8]">
                <span>RELIEF: +{activeObject?.reliefHeightM}m</span>
                <span>SHADOW: {activeObject?.shadowLengthM}m</span>
                <span className="text-cyan-400 font-bold">{activeObject?.confidence.toFixed(1)}% CONF</span>
              </div>
            </div>

            {/* Hydrographic & Quantitative Physical Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#08121e] border border-[#15273b] rounded-xl p-2.5">
                <span className="text-[10px] text-[#6c8299] block">SEABED DEPTH</span>
                <span className="text-sm font-bold text-white">{activeObject?.depthM} m</span>
                <span className="text-[9px] text-[#55697d] block mt-0.5">
                  Press: {(1 + (activeObject?.depthM || 30) / 10).toFixed(1)} atm
                </span>
              </div>

              <div className="bg-[#08121e] border border-[#15273b] rounded-xl p-2.5">
                <span className="text-[10px] text-[#6c8299] block">DIMENSIONS</span>
                <span className="text-xs font-bold text-white">{activeObject?.dimensions}</span>
                <span className="text-[9px] text-[#55697d] block mt-0.5">Volumetric Relief</span>
              </div>

              <div className="bg-[#08121e] border border-[#15273b] rounded-xl p-2.5">
                <span className="text-[10px] text-[#6c8299] block">BACKSCATTER</span>
                <span className="text-sm font-bold text-cyan-400">
                  {activeObject?.backscatterRatio} : 1.0
                </span>
                <span className="text-[9px] text-[#55697d] block mt-0.5">Specular Reflection</span>
              </div>

              <div className="bg-[#08121e] border border-[#15273b] rounded-xl p-2.5">
                <span className="text-[10px] text-[#6c8299] block">GPS COORDINATES</span>
                <span className="text-xs font-bold text-white">
                  {activeObject?.lat.toFixed(4)}°N
                </span>
                <span className="text-[9px] text-[#8ea4b8] block">
                  {activeObject?.lon.toFixed(4)}°E
                </span>
              </div>
            </div>

            {/* Gemini 3.8 Flash Acoustic Reasoning Assessment */}
            <div className="bg-[#091524] border border-[#19324c] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemini 3.8 Flash Acoustic Reasoning</span>
                </div>
                <button
                  id="btn-ai-deep-scan"
                  onClick={() => handleAiDeepScan(activeObject)}
                  disabled={isAiAnalyzing}
                  className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline disabled:opacity-50"
                >
                  {isAiAnalyzing ? 'Evaluating...' : 'Re-run AI Scan'}
                </button>
              </div>

              <p className="text-xs text-[#9bb2c8] leading-relaxed">
                {activeObject?.aiVerdict ||
                  'Sonar reflection analysis confirms an elevated rigid metallic obstacle displaying pronounced acoustic shadow occlusion.'}
              </p>

              {activeObject?.hazards && activeObject.hazards.length > 0 && (
                <div className="pt-1.5 border-t border-[#152a3f]">
                  <span className="text-[10px] font-mono text-[#6c8299] block mb-1">
                    TACTICAL HAZARDS IDENTIFIED:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeObject.hazards.map((hz, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#07101b] border border-[#162e46] text-[#b1c7dc]"
                      >
                        {hz}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sector Discovered Objects Quick Switcher Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-white">
                Discovered Contacts in Current Sector ({sectorObjects.filter((o) => o.isDiscovered).length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {sectorObjects.map((obj) => {
                  const isCur = obj.id === activeObject?.id;
                  return (
                    <button
                      key={obj.id}
                      onClick={() => handleFocusTarget(obj)}
                      className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1.5 ${
                        isCur
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                          : obj.isDiscovered
                          ? 'bg-[#08121e] text-[#8fa4b8] border-[#182e46] hover:text-white'
                          : 'bg-[#060e18] text-[#55697d] border-[#101f30] italic'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          !obj.isDiscovered
                            ? 'bg-slate-600'
                            : obj.priority === 'CRITICAL'
                            ? 'bg-rose-500'
                            : obj.priority === 'HIGH'
                            ? 'bg-amber-500'
                            : 'bg-cyan-400'
                        }`}
                      />
                      <span>
                        {obj.id}: {obj.name.slice(0, 14)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-2 border-t border-[#162b40] space-y-2">
            <button
              onClick={() => {
                if (onShowToast) {
                  onShowToast(`Target ${activeObject.id} marked as Ground-Truthed Hazard.`, 'success');
                }
                setSectorObjects((prev) =>
                  prev.map((o) => (o.id === activeObject.id ? { ...o, status: 'GROUND_TRUTHED' } : o))
                );
              }}
              className="w-full bg-[#122336] hover:bg-[#183049] text-white text-xs font-semibold py-2 rounded-xl border border-[#1d3856] transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mark as Verified Navigation Hazard</span>
            </button>

            <button
              onClick={() =>
                onNavigate('analyze', {
                  targetId:
                    activeObject.id === 'ANM-01'
                      ? 'target-01'
                      : activeObject.id === 'ANM-02'
                      ? 'target-02'
                      : 'target-03',
                })
              }
              className="w-full bg-[#00a3c4] hover:bg-[#0092b0] text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md shadow-cyan-950/40 flex items-center justify-center space-x-1.5 active:scale-[0.99]"
            >
              <span>Inspect Full Sonar Waterfall</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
