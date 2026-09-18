import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import Map, {
  NavigationControl,
  Marker,
  Source,
  Layer,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/maplibre";

import {
  MapPin,
  Navigation,
  Car,
  Bike,
  Footprints,
  Search,
  LoaderCircle,
  Clock3,
  Gauge,
  Users,
  CloudRain,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import "maplibre-gl/dist/maplibre-gl.css";


const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY;


type SelectedPoint = {
  latitude: number;
  longitude: number;
};


type TravelMode = "drive" | "cycle" | "walk";

type Place = {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
};

type RouteInsights = {
  distance: string;
  duration: string;
  arrival: string;
  roadCondition: string;
  roadDetail: string;
  mobilityLabel: string;
  mobilityValue: string;
  mobilityDetail: string;
  mobilityLevel: "LOW" | "MODERATE" | "HIGH" | "ACTIVE";
  incidentCount?: number;
  incidentText?: string;
};


function Mobility() {

  // ============================================================
  // MAP STATE
  // ============================================================

  const [selectedPoint, setSelectedPoint] =
    useState<SelectedPoint | null>(null);


  // ============================================================
  // ROUTE PLANNER STATE
  // ============================================================

  const [fromLocation, setFromLocation] = useState("");

  const [toLocation, setToLocation] = useState("");

  const [travelMode, setTravelMode] =
    useState<TravelMode>("drive");

  const mapRef = useRef<MapRef | null>(null);

  const [fromPoint, setFromPoint] = useState<Place | null>(null);
  const [toPoint, setToPoint] = useState<Place | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [routeInsights, setRouteInsights] =
    useState<RouteInsights | null>(null);

  const [fromSuggestions, setFromSuggestions] = useState<Place[]>([]);
  const [toSuggestions, setToSuggestions] = useState<Place[]>([]);

  const [fromLoading, setFromLoading] = useState(false);
  const [toLoading, setToLoading] = useState(false);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const searchPlaces = async (
    query: string,
    signal: AbortSignal
  ): Promise<Place[]> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&addressdetails=1&q=${encodeURIComponent(
        query
      )}`,
      {
        signal,
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Location search failed");
    }

    const data = await response.json();

    return data.map(
      (item: {
        place_id: number;
        display_name: string;
        name?: string;
        lat: string;
        lon: string;
      }) => ({
        id: String(item.place_id),
        name: item.name || item.display_name.split(",")[0],
        displayName: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      })
    );
  };

  useEffect(() => {
    if (fromPoint || fromLocation.trim().length < 3) {
      setFromSuggestions([]);
      setFromLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setFromLoading(true);
        const results = await searchPlaces(
          fromLocation.trim(),
          controller.signal
        );
        setFromSuggestions(results);
        setFromOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setFromSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setFromLoading(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fromLocation, fromPoint]);

  useEffect(() => {
    if (toPoint || toLocation.trim().length < 3) {
      setToSuggestions([]);
      setToLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setToLoading(true);
        const results = await searchPlaces(
          toLocation.trim(),
          controller.signal
        );
        setToSuggestions(results);
        setToOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setToSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setToLoading(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [toLocation, toPoint]);

  const chooseFromPlace = (place: Place) => {
    setFromPoint(place);
    setFromLocation(place.name);
    setFromSuggestions([]);
    setFromOpen(false);
    setRouteData(null);
    setRouteInsights(null);

    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 14,
      pitch: 67,
      bearing: -22,
      duration: 1200,
    });
  };

  const chooseToPlace = (place: Place) => {
    setToPoint(place);
    setToLocation(place.name);
    setToSuggestions([]);
    setToOpen(false);
    setRouteData(null);
    setRouteInsights(null);

    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: 14,
      pitch: 67,
      bearing: -22,
      duration: 1200,
    });
  };
const findRoute = async () => {
  if (!fromPoint || !toPoint) {
    setRouteError("Select both locations first.");
    return;
  }

  if (!TOMTOM_API_KEY) {
    setRouteError("TomTom API key is missing. Restart Vite after updating .env.");
    return;
  }

  try {
    setRouteLoading(true);
    setRouteError("");
    setRouteData(null);
    setRouteInsights(null);

    const tomTomMode =
      travelMode === "drive"
        ? "car"
        : travelMode === "cycle"
        ? "bicycle"
        : "pedestrian";

    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${fromPoint.latitude},${fromPoint.longitude}:` +
      `${toPoint.latitude},${toPoint.longitude}/json` +
      `?key=${encodeURIComponent(TOMTOM_API_KEY)}` +
      `&travelMode=${tomTomMode}` +
      `&routeType=fastest` +
      `&traffic=${travelMode === "drive" ? "true" : "false"}` +
      `&routeRepresentation=polyline` +
      `&computeTravelTimeFor=all`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detailedError?.message || "Route request failed");
    }

    if (!data.routes?.length) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const summary = route.summary;
    const coordinates: number[][] = route.legs.flatMap(
      (leg: { points: { latitude: number; longitude: number }[] }, legIndex: number) =>
        leg.points
          .slice(legIndex === 0 ? 0 : 1)
          .map((point) => [point.longitude, point.latitude])
    );

    if (coordinates.length < 2) {
      throw new Error("TomTom returned an incomplete route");
    }

    const distanceKm = summary.lengthInMeters / 1000;
    const durationMinutes = Math.max(
      1,
      Math.round(summary.travelTimeInSeconds / 60)
    );
    const arrival = new Date(
      Date.now() + summary.travelTimeInSeconds * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let roadCondition = "CLEAR";
    let roadDetail = "No rain detected near the route";

    let mobilityLabel =
      travelMode === "drive"
        ? "LIVE TRAFFIC"
        : travelMode === "cycle"
        ? "CYCLING ROUTE"
        : "WALKING ROUTE";
    let mobilityValue = "ACTIVE";
    let mobilityDetail =
      travelMode === "cycle"
        ? "Bicycle-compatible route"
        : "Pedestrian route";
    let mobilityLevel: RouteInsights["mobilityLevel"] = "ACTIVE";
    let incidentCount: number | undefined =
      travelMode === "drive" ? 0 : undefined;
    let incidentText: string | undefined =
      travelMode === "drive"
        ? "No active incidents detected along this route"
        : undefined;

    if (travelMode === "drive") {
      const trafficDelaySeconds = Number(summary.trafficDelayInSeconds || 0);
      const delayMinutes = Math.max(0, Math.round(trafficDelaySeconds / 60));
      const midpoint = coordinates[Math.floor(coordinates.length / 2)];

      let currentSpeed: number | null = null;
      let freeFlowSpeed: number | null = null;

      try {
        const trafficResponse = await fetch(
          `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${midpoint[1]},${midpoint[0]}&unit=KMPH&key=${encodeURIComponent(TOMTOM_API_KEY)}`
        );

        if (trafficResponse.ok) {
          const trafficData = await trafficResponse.json();
          const flow = trafficData.flowSegmentData;
          currentSpeed = Number(flow?.currentSpeed ?? 0) || null;
          freeFlowSpeed = Number(flow?.freeFlowSpeed ?? 0) || null;

          if (flow?.roadClosure) {
            roadCondition = "CLOSED";
            roadDetail = "A road closure was detected near this route";
          }
        }
      } catch (trafficError) {
        console.warn("Traffic flow details unavailable", trafficError);
      }

      const speedRatio =
        currentSpeed && freeFlowSpeed ? currentSpeed / freeFlowSpeed : null;

      mobilityLevel =
        delayMinutes >= 15 || (speedRatio !== null && speedRatio < 0.45)
          ? "HIGH"
          : delayMinutes >= 5 || (speedRatio !== null && speedRatio < 0.75)
          ? "MODERATE"
          : "LOW";
      mobilityValue = mobilityLevel;
      mobilityDetail = `${delayMinutes} min traffic delay${
        currentSpeed && freeFlowSpeed
          ? ` • ${Math.round(currentSpeed)}/${Math.round(freeFlowSpeed)} km/h`
          : ""
      }`;

      try {
        const routeLongitudes = coordinates.map((coordinate) => coordinate[0]);
        const routeLatitudes = coordinates.map((coordinate) => coordinate[1]);
        const padding = 0.015;
        const bbox = [
          Math.min(...routeLongitudes) - padding,
          Math.min(...routeLatitudes) - padding,
          Math.max(...routeLongitudes) + padding,
          Math.max(...routeLatitudes) + padding,
        ].join(",");
        const incidentFields =
          "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},from,to,length,delay,roadNumbers,timeValidity}}}";
        const incidentParams = new URLSearchParams({
          key: TOMTOM_API_KEY,
          bbox,
          fields: incidentFields,
          language: "en-GB",
          timeValidityFilter: "present",
        });
        const incidentResponse = await fetch(
          `https://api.tomtom.com/traffic/services/5/incidentDetails?${incidentParams.toString()}`
        );

        if (incidentResponse.ok) {
          const incidentData = await incidentResponse.json();
          const incidents = Array.isArray(incidentData.incidents)
            ? incidentData.incidents
            : [];
          incidentCount = incidents.length;

          if (incidents.length > 0) {
            const mostImportant = [...incidents].sort(
              (first: any, second: any) =>
                Number(second.properties?.magnitudeOfDelay || 0) -
                Number(first.properties?.magnitudeOfDelay || 0)
            )[0];
            incidentText =
              mostImportant.properties?.events?.[0]?.description ||
              mostImportant.properties?.from ||
              "Traffic incident detected along the route";
          } else {
            incidentText = "No active incidents detected along this route";
          }
        } else {
          incidentText = "Live incident feed is temporarily unavailable";
        }
      } catch (incidentError) {
        console.warn("Traffic incidents unavailable", incidentError);
        incidentText = "Live incident feed is temporarily unavailable";
      }
    }

    try {
      const midpoint = coordinates[Math.floor(coordinates.length / 2)];
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${midpoint[1]}&longitude=${midpoint[0]}&current=precipitation,rain,weather_code&timezone=auto`
      );

      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        const precipitation = Number(weather.current?.precipitation || 0);
        const rain = Number(weather.current?.rain || 0);
        const weatherCode = Number(weather.current?.weather_code || 0);
        const wetRoad = precipitation > 0 || rain > 0 || weatherCode >= 51;

        if (wetRoad && roadCondition !== "CLOSED") {
          roadCondition = precipitation >= 2.5 ? "CAUTION" : "WET";
          roadDetail = `${precipitation.toFixed(1)} mm precipitation near route`;
        }
      }
    } catch (weatherError) {
      console.warn("Weather-based road status unavailable", weatherError);
      if (roadCondition !== "CLOSED") {
        roadCondition = "UNKNOWN";
        roadDetail = "Live weather status unavailable";
      }
    }

    setRouteInsights({
      distance: `${distanceKm.toFixed(1)} km`,
      duration:
        durationMinutes >= 60
          ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : `${durationMinutes} min`,
      arrival,
      roadCondition,
      roadDetail,
      mobilityLabel,
      mobilityValue,
      mobilityDetail,
      mobilityLevel,
      incidentCount,
      incidentText,
    });

    setRouteData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates,
      },
    });

    if (coordinates.length > 0) {
      const longitudes = coordinates.map(
        (coordinate: number[]) => coordinate[0]
      );

      const latitudes = coordinates.map(
        (coordinate: number[]) => coordinate[1]
      );

      const bounds: [[number, number], [number, number]] = [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ];

      mapRef.current?.fitBounds(bounds, {
        padding: 80,
        duration: 1600,
        pitch: 60,
        bearing: -18,
      });
    }
  } catch (error) {
    console.error(error);
    setRouteData(null);
    setRouteInsights(null);
    setRouteError(
      error instanceof Error
        ? error.message
        : "Unable to calculate route."
    );
  } finally {
    setRouteLoading(false);
  }
};

  // ============================================================
  // MAP CLICK
  // ============================================================

  const handleMapClick = (event: MapMouseEvent) => {

    const { lng, lat } = event.lngLat;

    setSelectedPoint({
      latitude: lat,
      longitude: lng,
    });

  };

  const clearRoute = () => {
    setFromLocation("");
    setToLocation("");
    setFromPoint(null);
    setToPoint(null);
    setSelectedPoint(null);
    setRouteData(null);
    setRouteInsights(null);
    setRouteError("");
    setFromSuggestions([]);
    setToSuggestions([]);
    setFromOpen(false);
    setToOpen(false);
    setTravelMode("drive");

    mapRef.current?.flyTo({
      center: [85.8245, 20.2961],
      zoom: 12.2,
      pitch: 67,
      bearing: -22,
      duration: 1200,
    });
  };

  const routeLineColor =
    travelMode === "drive" && routeInsights?.mobilityLevel === "HIGH"
      ? "#fb7185"
      : travelMode === "cycle"
      ? "#34d399"
      : travelMode === "walk"
      ? "#fbbf24"
      : "#67e8f9";


  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020b12] text-white">


      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/mobility.png')",
        }}
        initial={{
          scale: 1.03,
          x: 0,
          y: 0,
        }}
        animate={{
          scale: [1.03, 1.08, 1.03],
          x: [0, -12, 0],
          y: [0, -6, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      {/* DARK OVERLAY */}

      <div className="absolute inset-0 bg-[#020b12]/75" />


      {/* CYAN ATMOSPHERIC GLOW */}

      <motion.div
        className="
          absolute inset-0
          bg-[radial-gradient(circle_at_55%_45%,rgba(34,211,238,0.17),transparent_48%)]
        "
        animate={{
          opacity: [0.65, 1, 0.65],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />


      {/* LEFT SHADOW */}

      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-[#020b12]/95
          via-[#020b12]/35
          to-transparent
        "
      />


      {/* ======================================================
          PAGE
      ====================================================== */}

      <section className="relative z-10 min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-[4vw]">


        {/* SECTION NUMBER */}

        <motion.p
          className="text-sm tracking-[0.35em] text-cyan-400"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
        >
          04 / MOBILITY
        </motion.p>


        {/* ======================================================
            MAIN LAYOUT
        ====================================================== */}

        <div className="mt-8 grid min-w-0 grid-cols-1 gap-7 lg:mt-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-10">


          {/* ====================================================
              LEFT INTRO
          ==================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -25,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.15,
            }}
          >

            <h1
              className="
                text-4xl
                sm:text-5xl
                font-light
                leading-[1.02]
                tracking-tight
              "
            >
              MOVE
              <br />

              THROUGH
              <br />

              THE CITY.
            </h1>


            <p
              className="
                mt-6
                max-w-[260px]
                text-sm
                leading-7
                tracking-[0.1em]
                text-slate-300
              "
            >
              Intelligent mobility for faster, cleaner and more connected
              urban movement.
            </p>


            {/* DECORATIVE LINE */}

            <div className="mt-7 h-px w-12 bg-cyan-400" />


            {/* NETWORK STATUS */}

            <div className="mt-7 lg:mt-10">

              <p
                className="
                  text-[10px]
                  tracking-[0.28em]
                  text-slate-500
                "
              >
                MOBILITY NETWORK
              </p>


              <div className="mt-3 flex items-center gap-3">

                <motion.span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-cyan-400
                  "
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />


                <span
                  className="
                    text-xs
                    tracking-[0.15em]
                    text-cyan-100
                  "
                >
                  SYSTEM ACTIVE
                </span>

              </div>

            </div>

          </motion.div>


          {/* ====================================================
              MOBILITY WORKSPACE
          ==================================================== */}

          <motion.div
            className="
              relative
              min-h-[975px]
              sm:min-h-[835px]
              lg:min-h-[755px]
              overflow-hidden
              rounded-2xl
              border
              border-cyan-400/20
              bg-[#03121b]/70
              backdrop-blur-md
            "
            initial={{
              opacity: 0,
              y: 25,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.9,
              delay: 0.25,
            }}
          >


            {/* ==================================================
                WORKSPACE HEADER
            ================================================== */}

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                border-b
                border-cyan-400/10
                gap-3
                px-4
                sm:px-6
                py-5
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    tracking-[0.25em]
                    text-slate-500
                  "
                >
                  AETHER MOBILITY INTELLIGENCE
                </p>


                <h2
                  className="
                    mt-1
                    text-lg
                    font-light
                    tracking-wide
                    text-white
                  "
                >
                  Urban Movement Network
                </h2>

              </div>


              {/* CONNECTED STATUS */}

              <div className="flex items-center gap-2">

                <motion.span
                  className="
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-400
                  "
                  animate={{
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                  }}
                />


                <span
                  className="
                    text-[10px]
                    tracking-[0.2em]
                    text-slate-400
                  "
                >
                  CONNECTED
                </span>

              </div>

            </div>


            {/* ==================================================
                MAP AREA
            ================================================== */}

            <div className="relative h-[900px] sm:h-[760px] lg:h-[680px]">


              {/* =================================================
                  REAL MAP
              ================================================= */}

              <Map
                ref={mapRef}
                initialViewState={{
                  longitude: 85.8245,
                  latitude: 20.2961,
                  zoom: 12.2,
                  pitch: 67,
                  bearing: -22,
                }}
                mapStyle={
                  `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`
                }
                onClick={handleMapClick}
                cursor="crosshair"
                terrain={{ source: "aether-terrain", exaggeration: 1.45 }}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >

                {/* REAL 3D TERRAIN — keeps the satellite map tilted instead of flat */}
                <Source
                  id="aether-terrain"
                  type="raster-dem"
                  url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`}
                  tileSize={256}
                />

                <NavigationControl
                  position="bottom-right"
                  showCompass={true}
                  showZoom={true}
                />

                {routeData && (
  <Source id="route-source" type="geojson" data={routeData}>
    <Layer
      id="route-casing"
      type="line"
      layout={{
        "line-cap": "round",
        "line-join": "round",
      }}
      paint={{
        "line-color": "#020b12",
        "line-width": 13,
        "line-opacity": 0.9,
      }}
    />

    <Layer
      id="route-glow"
      type="line"
      layout={{
        "line-cap": "round",
        "line-join": "round",
      }}
      paint={{
        "line-color": routeLineColor,
        "line-width": 18,
        "line-opacity": 0.45,
        "line-blur": 7,
      }}
    />

    <Layer
      id="route-line"
      type="line"
      layout={{
        "line-cap": "round",
        "line-join": "round",
      }}
      paint={{
        "line-color": routeLineColor,
        "line-width": 7,
        "line-opacity": 1,
      }}
    />
  </Source>
)}


                {/* ROUTE START MARKER */}

                {fromPoint && (
                  <Marker
                    longitude={fromPoint.longitude}
                    latitude={fromPoint.latitude}
                    anchor="bottom"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/70 bg-[#03121b] shadow-[0_0_18px_rgba(34,211,238,0.75)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    </div>
                  </Marker>
                )}


                {/* ROUTE DESTINATION MARKER */}

                {toPoint && (
                  <Marker
                    longitude={toPoint.longitude}
                    latitude={toPoint.latitude}
                    anchor="bottom"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/70 bg-[#03121b] shadow-[0_0_18px_rgba(251,113,133,0.65)]">
                      <MapPin size={15} className="text-rose-300" />
                    </div>
                  </Marker>
                )}


                {/* SELECTED LOCATION MARKER */}

                {selectedPoint && (

                  <Marker
                    longitude={selectedPoint.longitude}
                    latitude={selectedPoint.latitude}
                    anchor="center"
                  >

                    <div className="relative flex items-center justify-center">


                      {/* OUTER PULSE */}

                      <motion.div
                        className="
                          absolute
                          h-12
                          w-12
                          rounded-full
                          border
                          border-cyan-300/60
                        "
                        animate={{
                          scale: [0.6, 1.5],
                          opacity: [0.8, 0],
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />


                      {/* MIDDLE RING */}

                      <div
                        className="
                          absolute
                          h-6
                          w-6
                          rounded-full
                          border
                          border-cyan-300/70
                          bg-cyan-400/20
                        "
                      />


                      {/* CENTER POINT */}

                      <div
                        className="
                          relative
                          h-2.5
                          w-2.5
                          rounded-full
                          bg-cyan-300
                          shadow-[0_0_16px_rgba(103,232,249,1)]
                        "
                      />

                    </div>

                  </Marker>

                )}

              </Map>


              {/* MAP TOP GRADIENT */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-x-0
                  top-0
                  h-24
                  bg-gradient-to-b
                  from-[#03121b]/70
                  to-transparent
                "
              />


              {/* =================================================
                  MAP INSTRUCTION
              ================================================= */}

              <div
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-3
                  hidden
                  sm:block
                  sm:left-5
                  sm:top-5
                  z-10
                  rounded-lg
                  border
                  border-cyan-400/15
                  bg-[#020b12]/75
                  px-4
                  py-3
                  backdrop-blur-md
                "
              >

                <p
                  className="
                    text-[9px]
                    tracking-[0.22em]
                    text-cyan-300
                  "
                >
                  SELECT LOCATION
                </p>


                <p
                  className="
                    mt-1
                    text-[10px]
                    tracking-[0.08em]
                    text-slate-400
                  "
                >
                  Click anywhere on the city map
                </p>

              </div>


              {/* =================================================
                  NETWORK POSITION
              ================================================= */}

              <div
                className="
                  pointer-events-none
                  absolute
                  bottom-5
                  left-6
                  hidden
                  lg:block
                  z-10
                  rounded-lg
                  border
                  border-white/5
                  bg-[#020b12]/75
                  px-4
                  py-3
                  backdrop-blur-md
                "
              >

                <p
                  className="
                    text-[9px]
                    tracking-[0.2em]
                    text-slate-500
                  "
                >
                  NETWORK POSITION
                </p>


                <p
                  className="
                    mt-1
                    font-mono
                    text-[10px]
                    text-cyan-100
                  "
                >

                  {selectedPoint
                    ? `${selectedPoint.latitude.toFixed(
                        4
                      )}° N / ${selectedPoint.longitude.toFixed(4)}° E`
                    : "20.2961° N / 85.8245° E"}

                </p>

              </div>


              {/* =================================================
                  ROUTE PLANNER
              ================================================= */}

              <motion.div
                className="
                  absolute
                  bottom-4
                  left-3
                  right-3
                  z-20
                  w-auto
                  sm:left-auto
                  sm:right-4
                  sm:w-[330px]
                  lg:bottom-5
                  lg:right-16
                  lg:w-[310px]
                  rounded-xl
                  border
                  border-cyan-400/20
                  bg-[#020b12]/90
                  p-4
                  sm:p-5
                  shadow-[0_20px_60px_rgba(0,0,0,0.35)]
                  backdrop-blur-xl
                "
                initial={{
                  opacity: 0,
                  x: 25,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.7,
                }}
              >


                {/* ROUTE HEADER */}

                <div className="flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      border
                      border-cyan-400/20
                      bg-cyan-400/10
                    "
                  >
                    <Navigation
                      size={16}
                      className="text-cyan-300"
                    />
                  </div>


                  <div>

                    <p
                      className="
                        text-[9px]
                        tracking-[0.25em]
                        text-cyan-400
                      "
                    >
                      ROUTE INTELLIGENCE
                    </p>


                    <h3
                      className="
                        mt-1
                        text-sm
                        font-light
                        tracking-wide
                        text-white
                      "
                    >
                      Plan a Route
                    </h3>

                  </div>

                </div>


                {/* =================================================
                    FROM
                ================================================= */}

                <div className="mt-5">

                  <label
                    className="
                      text-[9px]
                      tracking-[0.2em]
                      text-slate-500
                    "
                  >
                    FROM
                  </label>


                  <div
                    className="
                      relative
                      mt-2
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      border
                      border-white/10
                      bg-white/[0.04]
                      px-3
                      transition
                      focus-within:border-cyan-400/40
                      focus-within:bg-cyan-400/[0.04]
                    "
                  >

                    <div
                      className="
                        h-2
                        w-2
                        shrink-0
                        rounded-full
                        bg-cyan-400
                        shadow-[0_0_10px_rgba(34,211,238,0.8)]
                      "
                    />


                    <input
                      type="text"
                      value={fromLocation}
                      onChange={(event) => {
                        setFromLocation(event.target.value);
                        setFromPoint(null);
                        setRouteData(null);
                        setRouteInsights(null);
                        setFromOpen(true);
                      }}
                      onFocus={() => setFromOpen(true)}
                      autoComplete="off"
                      placeholder="Starting location"
                      className="
                        w-full
                        bg-transparent
                        py-3
                        text-xs
                        tracking-wide
                        text-white
                        outline-none
                        placeholder:text-slate-600
                      "
                    />

                    {fromLoading ? (
                      <LoaderCircle
                        size={14}
                        className="shrink-0 animate-spin text-cyan-300"
                      />
                    ) : (
                      <Search
                        size={14}
                        className="shrink-0 text-slate-600"
                      />
                    )}

                    {fromOpen &&
                      fromLocation.trim().length >= 3 &&
                      !fromPoint && (
                        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-52 overflow-y-auto rounded-lg border border-cyan-400/20 bg-[#020b12]/98 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                          {fromLoading ? (
                            <p className="px-4 py-3 text-[10px] tracking-[0.12em] text-slate-500">
                              SEARCHING...
                            </p>
                          ) : fromSuggestions.length > 0 ? (
                            fromSuggestions.map((place) => (
                              <button
                                key={place.id}
                                type="button"
                                onClick={() => chooseFromPlace(place)}
                                className="block w-full border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-cyan-400/10"
                              >
                                <p className="text-[11px] text-cyan-100">
                                  {place.name}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">
                                  {place.displayName}
                                </p>
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-[10px] tracking-[0.12em] text-slate-500">
                              NO LOCATIONS FOUND
                            </p>
                          )}
                        </div>
                      )}

                  </div>

                </div>


                {/* SMALL CONNECTION LINE */}

                <div
                  className="
                    ml-[3px]
                    h-3
                    w-px
                    bg-gradient-to-b
                    from-cyan-400/50
                    to-rose-400/40
                  "
                />


                {/* =================================================
                    DESTINATION
                ================================================= */}

                <div>

                  <label
                    className="
                      text-[9px]
                      tracking-[0.2em]
                      text-slate-500
                    "
                  >
                    DESTINATION
                  </label>


                  <div
                    className="
                      relative
                      mt-2
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      border
                      border-white/10
                      bg-white/[0.04]
                      px-3
                      transition
                      focus-within:border-cyan-400/40
                      focus-within:bg-cyan-400/[0.04]
                    "
                  >

                    <MapPin
                      size={14}
                      className="
                        shrink-0
                        text-rose-400
                      "
                    />


                    <input
                      type="text"
                      value={toLocation}
                      onChange={(event) => {
                        setToLocation(event.target.value);
                        setToPoint(null);
                        setRouteData(null);
                        setRouteInsights(null);
                        setToOpen(true);
                      }}
                      onFocus={() => setToOpen(true)}
                      autoComplete="off"
                      placeholder="Where are you going?"
                      className="
                        w-full
                        bg-transparent
                        py-3
                        text-xs
                        tracking-wide
                        text-white
                        outline-none
                        placeholder:text-slate-600
                      "
                    />

                    {toLoading ? (
                      <LoaderCircle
                        size={14}
                        className="shrink-0 animate-spin text-cyan-300"
                      />
                    ) : (
                      <Search
                        size={14}
                        className="shrink-0 text-slate-600"
                      />
                    )}

                    {toOpen &&
                      toLocation.trim().length >= 3 &&
                      !toPoint && (
                        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-52 overflow-y-auto rounded-lg border border-cyan-400/20 bg-[#020b12]/98 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                          {toLoading ? (
                            <p className="px-4 py-3 text-[10px] tracking-[0.12em] text-slate-500">
                              SEARCHING...
                            </p>
                          ) : toSuggestions.length > 0 ? (
                            toSuggestions.map((place) => (
                              <button
                                key={place.id}
                                type="button"
                                onClick={() => chooseToPlace(place)}
                                className="block w-full border-b border-white/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-cyan-400/10"
                              >
                                <p className="text-[11px] text-cyan-100">
                                  {place.name}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-slate-500">
                                  {place.displayName}
                                </p>
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-[10px] tracking-[0.12em] text-slate-500">
                              NO LOCATIONS FOUND
                            </p>
                          )}
                        </div>
                      )}

                  </div>

                </div>


                {/* =================================================
                    TRAVEL MODE
                ================================================= */}

                <div className="mt-5">

                  <p
                    className="
                      text-[9px]
                      tracking-[0.2em]
                      text-slate-500
                    "
                  >
                    TRAVEL MODE
                  </p>


                  <div className="mt-3 grid grid-cols-3 gap-2">


                    {/* DRIVE */}

                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode("drive");
                        setRouteData(null);
                        setRouteInsights(null);
                      }}
                      className={`
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        py-3
                        transition-all
                        duration-300

                        ${
                          travelMode === "drive"
                            ? `
                              border-cyan-400/50
                              bg-cyan-400/10
                              text-cyan-300
                              shadow-[0_0_20px_rgba(34,211,238,0.08)]
                            `
                            : `
                              border-white/10
                              bg-white/[0.03]
                              text-slate-500
                              hover:border-white/20
                              hover:text-slate-300
                            `
                        }
                      `}
                    >

                      <Car size={17} />

                      <span
                        className="
                          text-[8px]
                          tracking-[0.15em]
                        "
                      >
                        DRIVE
                      </span>

                    </button>


                    {/* CYCLE */}

                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode("cycle");
                        setRouteData(null);
                        setRouteInsights(null);
                      }}
                      className={`
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        py-3
                        transition-all
                        duration-300

                        ${
                          travelMode === "cycle"
                            ? `
                              border-cyan-400/50
                              bg-cyan-400/10
                              text-cyan-300
                              shadow-[0_0_20px_rgba(34,211,238,0.08)]
                            `
                            : `
                              border-white/10
                              bg-white/[0.03]
                              text-slate-500
                              hover:border-white/20
                              hover:text-slate-300
                            `
                        }
                      `}
                    >

                      <Bike size={17} />

                      <span
                        className="
                          text-[8px]
                          tracking-[0.15em]
                        "
                      >
                        CYCLE
                      </span>

                    </button>


                    {/* WALK */}

                    <button
                      type="button"
                      onClick={() => {
                        setTravelMode("walk");
                        setRouteData(null);
                        setRouteInsights(null);
                      }}
                      className={`
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        border
                        py-3
                        transition-all
                        duration-300

                        ${
                          travelMode === "walk"
                            ? `
                              border-cyan-400/50
                              bg-cyan-400/10
                              text-cyan-300
                              shadow-[0_0_20px_rgba(34,211,238,0.08)]
                            `
                            : `
                              border-white/10
                              bg-white/[0.03]
                              text-slate-500
                              hover:border-white/20
                              hover:text-slate-300
                            `
                        }
                      `}
                    >

                      <Footprints size={17} />

                      <span
                        className="
                          text-[8px]
                          tracking-[0.15em]
                        "
                      >
                        WALK
                      </span>

                    </button>

                  </div>

                </div>


                {/* =================================================
                    FIND ROUTE BUTTON
                ================================================= */}

                <button
                  type="button"
                  onClick={findRoute}
                  disabled={routeLoading}
                  className="
                    mt-5
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-cyan-300/40
                    bg-cyan-400/10
                    py-3
                    text-[9px]
                    tracking-[0.22em]
                    text-cyan-200
                    transition-all
                    duration-300
                    hover:border-cyan-300/70
                    hover:bg-cyan-400/20
                    hover:shadow-[0_0_25px_rgba(34,211,238,0.12)]
                    disabled:cursor-wait
                    disabled:opacity-60
                  "
                >

                  {routeLoading ? (
                    <>
                      <LoaderCircle size={13} className="animate-spin" />
                      CALCULATING...
                    </>
                  ) : (
                    <>
                      <Navigation size={13} />
                      FIND ROUTE
                    </>
                  )}

                </button>

                <button
                  type="button"
                  onClick={clearRoute}
                  disabled={
                    routeLoading ||
                    (!fromLocation && !toLocation && !routeData && !routeInsights)
                  }
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] py-2.5 text-[9px] font-semibold tracking-[0.22em] text-slate-400 transition-all duration-300 hover:border-cyan-400/20 hover:bg-cyan-400/[0.06] hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw size={13} />
                  CLEAR ROUTE
                </button>

                {routeError && (
                  <p className="mt-3 text-center text-[9px] tracking-wider text-rose-300">
                    {routeError}
                  </p>
                )}

                {routeInsights && (
                  <div className="mt-4 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
                    <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-3">
                      <div>
                        <p className="text-[8px] tracking-[0.16em] text-slate-500">DISTANCE</p>
                        <p className="mt-1 text-[11px] text-cyan-100">{routeInsights.distance}</p>
                      </div>
                      <div>
                        <p className="text-[8px] tracking-[0.16em] text-slate-500">DURATION</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-cyan-100">
                          <Clock3 size={10} /> {routeInsights.duration}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] tracking-[0.16em] text-slate-500">ARRIVAL</p>
                        <p className="mt-1 text-[11px] text-cyan-100">{routeInsights.arrival}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-md border border-white/5 bg-black/10 p-2.5">
                        <p className="flex items-center gap-1.5 text-[8px] tracking-[0.14em] text-slate-500">
                          <CloudRain size={11} /> ROAD STATUS
                        </p>
                        <p className="mt-1 text-[10px] text-emerald-300">{routeInsights.roadCondition}</p>
                        <p className="mt-1 text-[8px] leading-3 text-slate-500">{routeInsights.roadDetail}</p>
                      </div>
                      <div className="rounded-md border border-white/5 bg-black/10 p-2.5">
                        <p className="flex items-center gap-1.5 text-[8px] tracking-[0.14em] text-slate-500">
                          <Users size={11} /> {routeInsights.mobilityLabel}
                        </p>
                        <p className={`mt-1 text-[10px] ${
                          routeInsights.mobilityLevel === "HIGH"
                            ? "text-rose-300"
                            : routeInsights.mobilityLevel === "MODERATE"
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}>
                          {routeInsights.mobilityValue}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[8px] leading-3 text-slate-500">
                          <Gauge size={9} /> {routeInsights.mobilityDetail}
                        </p>
                      </div>
                    </div>

                    {travelMode === "drive" &&
                      routeInsights.incidentCount !== undefined && (
                        <div className="mt-2 rounded-md border border-rose-400/15 bg-rose-400/[0.04] p-2.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle
                              size={12}
                              className={
                                routeInsights.incidentCount > 0
                                  ? "mt-0.5 shrink-0 text-rose-300"
                                  : "mt-0.5 shrink-0 text-emerald-300"
                              }
                            />
                            <div>
                              <p className="text-[8px] tracking-[0.14em] text-slate-500">
                                LIVE TRAFFIC INCIDENTS
                              </p>
                              <p
                                className={`mt-1 text-[10px] ${
                                  routeInsights.incidentCount > 0
                                    ? "text-rose-300"
                                    : "text-emerald-300"
                                }`}
                              >
                                {routeInsights.incidentCount} ACTIVE
                              </p>
                              <p className="mt-1 text-[8px] leading-3 text-slate-500">
                                {routeInsights.incidentText}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}


              </motion.div>

            </div>

          </motion.div>

        </div>

      </section>

    </main>
  );
}


export default Mobility;
