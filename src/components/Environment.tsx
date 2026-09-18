import { useEffect, useState } from "react";
import { motion } from "motion/react";

import Map, {
  Marker,
  NavigationControl,
} from "react-map-gl/maplibre";

import type { MapLayerMouseEvent } from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  MapPin,
  Waves,
} from "lucide-react";


/* ========================================
   TYPES
======================================== */

type Location = {
  latitude: number;
  longitude: number;
};

type WeatherData = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rain: number;
};

type AirQualityData = {
  aqi: number;
  pm25: number;
  pm10: number;
};

type HourlyTemperature = {
  time: string;
  temperature: number;
};

type LocationName = {
  city: string;
  state: string;
};

type CityPhoto = {
  imageUrl: string;
  photographerName: string;
  photographerUrl: string;
  photoUrl: string;
  alt: string;
};


/* ========================================
   UNSPLASH
======================================== */

const MAPTILER_KEY =
  import.meta.env.VITE_MAPTILER_KEY as string | undefined;

const UNSPLASH_ACCESS_KEY =
  import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;


/* ========================================
   MAP STYLE
======================================== */

const mapStyle = {
  version: 8 as const,

  sources: {
    satellite: {
      type: "raster" as const,
      url: `https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=${MAPTILER_KEY}`,
      tileSize: 512,
      attribution: "© MapTiler © OpenStreetMap contributors",
    },

    terrain: {
      type: "raster-dem" as const,
      url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
      tileSize: 512,
      maxzoom: 14,
    },
  },

  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: {
        "background-color": "#02090a",
      },
    },

    {
      id: "satellite",
      type: "raster" as const,
      source: "satellite",
      paint: {
        "raster-saturation": -0.12,
        "raster-contrast": 0.18,
        "raster-brightness-min": 0.03,
        "raster-brightness-max": 0.82,
      },
    },

    {
      id: "terrain-hillshade",
      type: "hillshade" as const,
      source: "terrain",
      paint: {
        "hillshade-exaggeration": 0.55,
        "hillshade-shadow-color": "#00110d",
        "hillshade-highlight-color": "#b8ffe1",
        "hillshade-accent-color": "#12382e",
      },
    },
  ],

  terrain: {
    source: "terrain",
    exaggeration: 1.65,
  },
};


/* ========================================
   ENVIRONMENT COMPONENT
======================================== */

function Environment() {

  /* ========================================
     SELECTED LOCATION
  ======================================== */

  const [selectedLocation, setSelectedLocation] =
    useState<Location>({
      latitude: 20.2961,
      longitude: 85.8245,
    });


  /* ========================================
     LOCATION NAME
  ======================================== */

  const [locationName, setLocationName] =
    useState<LocationName>({
      city: "Bhubaneswar",
      state: "Odisha",
    });

  const [cityPhoto, setCityPhoto] =
    useState<CityPhoto | null>(null);

  const [cityPhotoLoading, setCityPhotoLoading] =
    useState(false);


  /* ========================================
     WEATHER
  ======================================== */

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [airQuality, setAirQuality] =
    useState<AirQualityData | null>(null);

  const [hourlyTemperatures, setHourlyTemperatures] =
    useState<HourlyTemperature[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  /* ========================================
     FETCH WEATHER + LOCATION NAME
  ======================================== */

  useEffect(() => {

    async function loadEnvironmentData() {

      try {

        setLoading(true);
        setError(null);
        setAirQuality(null);
        setHourlyTemperatures([]);


        /* ==================================
           WEATHER API
        ================================== */

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${selectedLocation.latitude}` +
          `&longitude=${selectedLocation.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,rain` +
          `&hourly=temperature_2m` +
          `&forecast_days=1` +
          `&timezone=auto`
        );


        if (!weatherResponse.ok) {

          throw new Error(
            "Weather data could not be loaded."
          );

        }


        const weatherData =
          await weatherResponse.json();


        setWeather({
          temperature:
            weatherData.current.temperature_2m,

          humidity:
            weatherData.current.relative_humidity_2m,

          windSpeed:
            weatherData.current.wind_speed_10m,

          rain:
            weatherData.current.rain,
        });

        const hourlyTimes: string[] =
          weatherData.hourly?.time ?? [];

        const hourlyValues: number[] =
          weatherData.hourly?.temperature_2m ?? [];

        setHourlyTemperatures(
          hourlyTimes
            .slice(0, 24)
            .map((time, index) => ({
              time,
              temperature: hourlyValues[index],
            }))
            .filter((item) =>
              Number.isFinite(item.temperature)
            )
        );


        /* ==================================
           AIR QUALITY API
        ================================== */

        const airQualityResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${selectedLocation.latitude}` +
          `&longitude=${selectedLocation.longitude}` +
          `&current=us_aqi,pm2_5,pm10` +
          `&timezone=auto`
        );

        if (!airQualityResponse.ok) {
          throw new Error(
            "Air quality data could not be loaded."
          );
        }

        const airQualityData =
          await airQualityResponse.json();

        setAirQuality({
          aqi:
            airQualityData.current.us_aqi,

          pm25:
            airQualityData.current.pm2_5,

          pm10:
            airQualityData.current.pm10,
        });


        /* ==================================
           REVERSE GEOCODING
        ================================== */

        const locationResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse` +
          `?format=jsonv2` +
          `&lat=${selectedLocation.latitude}` +
          `&lon=${selectedLocation.longitude}` +
          `&zoom=10` +
          `&addressdetails=1`
        );


        if (locationResponse.ok) {

          const locationData =
            await locationResponse.json();


          const address =
            locationData.address ?? {};


          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            address.state_district ||
            "Unknown location";


          const state =
            address.state || "India";


          setLocationName({
            city,
            state,
          });

        }

      }

      catch (error) {

        console.error(error);

        setError(
          "Unable to load environmental data."
        );

      }

      finally {

        setLoading(false);

      }

    }


    loadEnvironmentData();

  }, [selectedLocation]);


  /* ========================================
     FETCH CITY / LANDMARK PHOTO
  ======================================== */

  useEffect(() => {
    const controller = new AbortController();

    async function loadCityPhoto() {
      if (!UNSPLASH_ACCESS_KEY) {
        setCityPhoto(null);
        return;
      }

      setCityPhotoLoading(true);

      const searches = [
        `${locationName.city} ${locationName.state} India landmark architecture`,
        `${locationName.city} ${locationName.state} India`,
        `${locationName.state} India landmark`,
        `India heritage architecture`,
      ];

      try {
        let selectedPhoto: any = null;

        for (const query of searches) {
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
              `&page=1&per_page=12&orientation=landscape&content_filter=high`,
            {
              headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
                "Accept-Version": "v1",
              },
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error("City image could not be loaded.");
          }

          const data = await response.json();

          if (Array.isArray(data.results) && data.results.length > 0) {
            const pool = data.results.slice(0, Math.min(6, data.results.length));
            selectedPhoto =
              pool[Math.floor(Math.random() * pool.length)];
            break;
          }
        }

        if (!selectedPhoto) {
          setCityPhoto(null);
          return;
        }

        const profileBase =
          selectedPhoto.user?.links?.html ||
          `https://unsplash.com/@${selectedPhoto.user?.username ?? ""}`;

        const photoBase =
          selectedPhoto.links?.html || "https://unsplash.com/";

        setCityPhoto({
          imageUrl:
            selectedPhoto.urls?.regular ||
            selectedPhoto.urls?.small ||
            "",
          photographerName:
            selectedPhoto.user?.name || "Unsplash photographer",
          photographerUrl:
            `${profileBase}${profileBase.includes("?") ? "&" : "?"}` +
            `utm_source=aether&utm_medium=referral`,
          photoUrl:
            `${photoBase}${photoBase.includes("?") ? "&" : "?"}` +
            `utm_source=aether&utm_medium=referral`,
          alt:
            selectedPhoto.alt_description ||
            selectedPhoto.description ||
            `${locationName.city}, ${locationName.state}`,
        });
      } catch (photoError) {
        if ((photoError as Error).name !== "AbortError") {
          console.error(photoError);
          setCityPhoto(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCityPhotoLoading(false);
        }
      }
    }

    loadCityPhoto();

    return () => controller.abort();
  }, [locationName.city, locationName.state]);


  /* ========================================
     MAP CLICK
  ======================================== */

  function handleMapClick(
    event: MapLayerMouseEvent
  ) {

    const latitude =
      event.lngLat.lat;

    const longitude =
      event.lngLat.lng;


    /*
      Keep environmental selection
      around the India region.
    */

    if (
      latitude < 6 ||
      latitude > 38 ||
      longitude < 67 ||
      longitude > 98
    ) {
      return;
    }


    setSelectedLocation({
      latitude,
      longitude,
    });

  }


  /* ========================================
     24H TEMPERATURE CHART
  ======================================== */

  const chartWidth = 600;
  const chartHeight = 120;
  const chartPadding = 12;

  const temperatureValues =
    hourlyTemperatures.map((item) => item.temperature);

  const minimumTemperature =
    temperatureValues.length > 0
      ? Math.min(...temperatureValues)
      : 0;

  const maximumTemperature =
    temperatureValues.length > 0
      ? Math.max(...temperatureValues)
      : 1;

  const temperatureRange =
    Math.max(maximumTemperature - minimumTemperature, 1);

  const temperaturePoints =
    hourlyTemperatures
      .map((item, index) => {
        const x =
          chartPadding +
          (index /
            Math.max(hourlyTemperatures.length - 1, 1)) *
            (chartWidth - chartPadding * 2);

        const y =
          chartHeight -
          chartPadding -
          ((item.temperature - minimumTemperature) /
            temperatureRange) *
            (chartHeight - chartPadding * 2);

        return `${x},${y}`;
      })
      .join(" ");

  const temperatureAreaPoints =
    temperaturePoints
      ? `${chartPadding},${chartHeight - chartPadding} ${temperaturePoints} ${chartWidth - chartPadding},${chartHeight - chartPadding}`
      : "";

  /* ========================================
     PAGE
  ======================================== */

  return (

    <main
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#010807]
        px-4
        py-5
        sm:px-6
        sm:py-6
        lg:px-[4vw]
        lg:py-8
        text-white
      "
    >


      {/* ==================================
          CINEMATIC ENVIRONMENT BACKGROUND
      ================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* MOVING BACKGROUND IMAGE */}
        <motion.img
          src="/images/environment.jpg"
          alt=""
          aria-hidden="true"
          className="
            absolute
            -inset-[4%]
            h-[108%]
            w-[108%]
            object-cover
            object-center
            opacity-[0.88]
          "
          initial={{
            scale: 1.04,
            x: 0,
            y: 0,
          }}
          animate={{
            scale: [1.04, 1.09, 1.04],
            x: [0, -14, 0],
            y: [0, 7, 0],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* DARK GREEN IMAGE TINT */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(110deg,rgba(0,8,8,0.50)_0%,rgba(1,25,18,0.30)_35%,rgba(0,20,17,0.25)_62%,rgba(0,7,9,0.55)_100%)]
          "
        />

        {/* MAP-SIDE EMERALD ATMOSPHERE */}
        <motion.div
          className="
            absolute
            left-[-25%]
            top-[22%]
            h-[120vw]
            max-h-[760px]
            w-[120vw]
            max-w-[900px]

            sm:left-[-5%]
            sm:h-[80vw]
            sm:w-[80vw]

            lg:left-[8%]
            lg:h-[58vw]
            lg:w-[58vw]
            rounded-full
            bg-[radial-gradient(circle,rgba(43,255,174,0.14)_0%,rgba(20,186,126,0.07)_32%,transparent_68%)]
            blur-[45px]
          "
          animate={{
            opacity: [0.35, 0.58, 0.35],
            scale: [0.96, 1.06, 0.96],
            x: [0, 20, 0],
            y: [0, -12, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* RIGHT-PANEL CYAN/GREEN AMBIENCE */}
        <motion.div
          className="
            absolute
            right-[-45%]
            top-[30%]
            h-[380px]
            w-[380px]

            sm:right-[-20%]
            sm:top-[18%]
            sm:h-[460px]
            sm:w-[460px]

            lg:right-[-8%]
            lg:top-[8%]
            lg:h-[520px]
            lg:w-[520px]
            rounded-full
            bg-[radial-gradient(circle,rgba(0,224,184,0.13)_0%,rgba(20,130,105,0.06)_40%,transparent_72%)]
            blur-[55px]
          "
          animate={{
            opacity: [0.35, 0.65, 0.35],
            scale: [1, 1.12, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* SUBTLE TECH GRID */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
            bg-[linear-gradient(rgba(92,242,165,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(92,242,165,0.16)_1px,transparent_1px)]
            bg-[size:70px_70px]
          "
        />

        {/* CINEMATIC VIGNETTE */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,7,8,0.14)_68%,rgba(0,4,6,0.58)_100%)]
          "
        />

        {/* TOP/BOTTOM DEPTH */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(to_bottom,rgba(0,4,6,0.24)_0%,transparent_24%,transparent_76%,rgba(0,4,5,0.42)_100%)]
          "
        />

      </div>


      {/* ==================================
          HEADER
      ================================== */}

      <header
        className="
          relative
          z-10

          mb-5

          flex
          flex-col
          items-start
          justify-between
          gap-4

          sm:mb-6
          lg:flex-row
          lg:items-end
          lg:gap-8
        "
      >

        <div>

          <p
            className="
              mb-3

              text-[10px]
              tracking-[0.35em]

              text-[#5cf2a5]
            "
          >
            03 / ENVIRONMENT
          </p>


          <h1
            className="
              text-[clamp(31px,9vw,62px)]
              sm:text-[clamp(38px,6vw,62px)]
              lg:text-[clamp(36px,4vw,62px)]

              font-light
              leading-[0.95]
              tracking-[-0.035em]
            "
          >

            EXPLORE INDIA'S{" "}

            <span className="text-[#5cf2a5]">
              ENVIRONMENT.
            </span>

          </h1>


          <p
            className="
              mt-4
              max-w-[560px]

              text-[12px]
              leading-5

              sm:text-[13px]
              sm:leading-6

              text-white/45
            "
          >
            Click anywhere across India to analyse
            environmental conditions for that location.
          </p>

        </div>


        <div
          className="
            mb-1
            hidden
            items-center
            gap-2

            text-[9px]
            tracking-[0.22em]

            text-white/30

            lg:flex
          "
        >

          <span
            className="
              h-[6px]
              w-[6px]

              rounded-full

              bg-[#5cf2a5]

              shadow-[0_0_12px_rgba(92,242,165,0.9)]
            "
          />

          AETHER ENVIRONMENT NETWORK

        </div>

      </header>


      {/* ==================================
          MAIN WORKSPACE
      ================================== */}

      <section
        className="
          relative
          z-10

          grid
          grid-cols-1

          gap-5

          xl:grid-cols-[1.55fr_0.75fr]
        "
      >


        {/* ==================================
            MAP PANEL
        ================================== */}

        <div
          className="
            overflow-hidden

            border
            border-[#5cf2a5]/15

            bg-[#04100f]/80

            shadow-[0_30px_100px_rgba(0,0,0,0.38)]
          "
        >


          {/* MAP HEADER */}

          <div
            className="
              flex
              min-h-[58px]
              items-center
              justify-between

              sm:min-h-[62px]

              border-b
              border-[#5cf2a5]/10

              bg-[#03100f]/90

              px-3

              sm:px-5
            "
          >

            <div>

              <p
                className="
                  text-[9px]
                  tracking-[0.28em]

                  text-[#5cf2a5]
                "
              >
                LIVE ENVIRONMENT MAP
              </p>


              <p
                className="
                  mt-1

                  text-[9px]
                  tracking-[0.12em]

                  text-white/25
                "
              >
                INDIA / ENVIRONMENTAL ANALYSIS
              </p>

            </div>


            <div
              className="
                flex
                items-center
                gap-2

                text-[9px]
                tracking-[0.2em]

                text-white/40
              "
            >

              <span
                className="
                  h-[5px]
                  w-[5px]

                  rounded-full

                  bg-[#5cf2a5]

                  shadow-[0_0_8px_#5cf2a5]
                "
              />

              LIVE

            </div>

          </div>


          {/* ==================================
              3D MAP
          ================================== */}

          <div
            className="
              relative

              h-[390px]

              overflow-hidden

              sm:h-[460px]
              lg:h-[530px]

              bg-[#02090a]
            "
          >

            <Map

              initialViewState={{
                longitude: 80.5,
                latitude: 22.5,
                zoom: 4.15,
                pitch: 48,
                bearing: -7,
              }}

              mapStyle={mapStyle}

              onClick={handleMapClick}

              minZoom={3.5}

              maxZoom={11}

              maxPitch={70}

              dragRotate={true}

              touchPitch={true}

              cursor="crosshair"

              style={{
                width: "100%",
                height: "100%",
              }}

            >


              {/* MAP CONTROLS */}

              <NavigationControl
                position="bottom-right"
                showCompass={true}
                showZoom={true}
              />


              {/* ==================================
                  SELECTED LOCATION MARKER
              ================================== */}

              <Marker

                longitude={
                  selectedLocation.longitude
                }

                latitude={
                  selectedLocation.latitude
                }

                anchor="center"

              >

                <div
                  className="
                    relative

                    flex
                    h-12
                    w-12

                    items-center
                    justify-center
                  "
                >

                  {/* PULSE */}

                  <span
                    className="
                      absolute

                      h-8
                      w-8

                      animate-ping

                      rounded-full

                      border
                      border-[#5cf2a5]/70
                    "
                  />


                  {/* RING */}

                  <span
                    className="
                      absolute

                      h-6
                      w-6

                      rounded-full

                      border
                      border-[#5cf2a5]/70
                    "
                  />


                  {/* CORE */}

                  <span
                    className="
                      relative
                      z-10

                      h-3
                      w-3

                      rounded-full

                      border-2
                      border-white

                      bg-[#5cf2a5]

                      shadow-[0_0_10px_#5cf2a5,0_0_25px_rgba(92,242,165,0.85)]
                    "
                  />

                </div>

              </Marker>

            </Map>


            {/* ==================================
                MAP VIGNETTE
            ================================== */}

            <div
              className="
                pointer-events-none

                absolute
                inset-0

                bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,7,8,0.68)_100%)]

                shadow-[inset_0_0_100px_20px_rgba(0,8,9,0.72)]
              "
            />


            {/* ==================================
                SCAN LINES
            ================================== */}

            <div
              className="
                pointer-events-none

                absolute
                inset-0

                opacity-[0.035]

                bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(120,255,215,0.55)_4px)]
              "
            />


            {/* ==================================
                MAP INSTRUCTION
            ================================== */}

            <div
              className="
                pointer-events-none

                absolute
                bottom-3
                left-3

                sm:bottom-5
                sm:left-5

                flex
                items-center
                gap-3

                border
                border-[#5cf2a5]/20

                bg-[#020d0d]/75

                px-3
                py-2.5

                sm:px-4
                sm:py-3

                backdrop-blur-md
              "
            >

              <span
                className="
                  text-lg
                  font-light
                  text-[#5cf2a5]
                "
              >
                +
              </span>


              <span
                className="
                  text-[8px]
                  tracking-[0.12em]

                  sm:text-[9px]
                  sm:tracking-[0.18em]

                  text-white/50
                "
              >
                CLICK ANY LOCATION TO ANALYSE
              </span>

            </div>

          </div>


          {/* ==================================
              MAP FOOTER
          ================================== */}

          <div
            className="
              hidden

              min-h-10

              items-center
              justify-between

              border-t
              border-[#5cf2a5]/10

              px-5

              text-[8px]
              tracking-[0.15em]

              text-white/20

              sm:flex
            "
          >

            <span>
              06°N — 38°N
            </span>

            <span>
              DRAG TO ROTATE / SCROLL TO ZOOM
            </span>

            <span>
              67°E — 98°E
            </span>

          </div>

        </div>


        {/* ==================================
            ENVIRONMENT DATA PANEL
        ================================== */}

        <aside
          className="
            min-w-0

            border
            border-[#5cf2a5]/15

            bg-[linear-gradient(145deg,rgba(8,30,27,0.84),rgba(2,11,12,0.95))]

            p-4

            backdrop-blur-xl

            sm:p-5
            lg:p-6
          "
        >


          {/* ==================================
              LOCATION
          ================================== */}

          <section
            className="
              border-b
              border-[#5cf2a5]/10

              pb-6
            "
          >

            {/* ==================================
                DYNAMIC CITY / LANDMARK IMAGE
            ================================== */}

            <div
              className="
                relative
                mb-6
                h-[170px]
                overflow-hidden

                sm:h-[190px]
                border
                border-[#5cf2a5]/15
                bg-[#03100f]
              "
            >
              {cityPhotoLoading && (
                <div
                  className="
                    absolute
                    inset-0
                    flex
                    items-center
                    justify-center
                    bg-[#03100f]
                    text-[9px]
                    tracking-[0.2em]
                    text-white/35
                  "
                >
                  FINDING LOCAL LANDMARK...
                </div>
              )}

              {!cityPhotoLoading && cityPhoto && (
                <>
                  <img
                    src={cityPhoto.imageUrl}
                    alt={cityPhoto.alt}
                    className="
                      h-full
                      w-full
                      object-cover
                    "
                  />

                  <div
                    className="
                      pointer-events-none
                      absolute
                      inset-0
                      bg-[linear-gradient(to_top,rgba(1,10,10,0.96)_0%,rgba(1,10,10,0.18)_62%,rgba(1,10,10,0.08)_100%)]
                    "
                  />

                  <div
                    className="
                      absolute
                      bottom-0
                      left-0
                      right-0
                      flex
                      items-end
                      justify-between
                      gap-4
                      p-4
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          text-[8px]
                          tracking-[0.24em]
                          text-[#5cf2a5]
                        "
                      >
                        LOCAL VIEW
                      </p>

                      <p
                        className="
                          mt-1
                          truncate
                          text-sm
                          font-light
                          text-white
                        "
                      >
                        {locationName.city}, {locationName.state}
                      </p>
                    </div>

                    <p
                      className="
                        max-w-[48%]
                        text-right
                        text-[7px]
                        leading-3
                        text-white/45
                      "
                    >
                      Photo by{" "}
                      <a
                        href={cityPhoto.photographerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/70 hover:text-[#5cf2a5]"
                      >
                        {cityPhoto.photographerName}
                      </a>{" "}
                      on{" "}
                      <a
                        href={cityPhoto.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/70 hover:text-[#5cf2a5]"
                      >
                        Unsplash
                      </a>
                    </p>
                  </div>
                </>
              )}

              {!cityPhotoLoading && !cityPhoto && (
                <div
                  className="
                    absolute
                    inset-0
                    flex
                    flex-col
                    items-center
                    justify-center
                    bg-[radial-gradient(circle_at_center,rgba(92,242,165,0.10),transparent_62%)]
                    text-center
                  "
                >
                  <span className="text-2xl text-[#5cf2a5]/50">⌖</span>
                  <p
                    className="
                      mt-3
                      text-[9px]
                      tracking-[0.18em]
                      text-white/30
                    "
                  >
                    LOCAL IMAGE UNAVAILABLE
                  </p>
                </div>
              )}
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between

                gap-3

                sm:gap-4
              "
            >

              <p
                className="
                  text-[9px]
                  tracking-[0.28em]

                  text-[#5cf2a5]
                "
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin
                    size={17}
                    strokeWidth={1.8}
                    className="text-[#21dfd2] drop-shadow-[0_0_7px_rgba(33,223,210,0.35)]"
                  />
                  SELECTED LOCATION
                </span>
              </p>


              <p
                className="
                  text-[8px]
                  tracking-[0.15em]

                  text-[#5cf2a5]
                "
              >
                ● LIVE
              </p>

            </div>


            <h2
              className="
                mt-4

                break-words
                text-[clamp(27px,8vw,42px)]

                sm:text-[clamp(30px,5vw,42px)]
                xl:text-[clamp(28px,2.5vw,42px)]

                font-light
                leading-none
              "
            >
              {locationName.city}
            </h2>


            <p
              className="
                mt-2

                text-[13px]

                text-[#5cf2a5]
              "
            >
              {locationName.state}
            </p>


            <p
              className="
                mt-3

                break-all
                font-mono

                text-[9px]
                tracking-[0.04em]

                sm:text-[10px]
                sm:tracking-[0.06em]

                text-white/25
              "
            >

              {selectedLocation.latitude.toFixed(4)}° N

              <span className="mx-2">
                /
              </span>

              {selectedLocation.longitude.toFixed(4)}° E

            </p>

          </section>


          {/* ==================================
              LOADING
          ================================== */}

          {loading && (

            <div
              className="
                flex
                items-center
                gap-3

                border-b
                border-[#5cf2a5]/10

                py-5

                text-[9px]
                tracking-[0.18em]

                text-white/40
              "
            >

              <span
                className="
                  h-2
                  w-2

                  animate-pulse

                  rounded-full

                  bg-[#5cf2a5]
                "
              />

              ANALYSING LOCATION...

            </div>

          )}


          {/* ==================================
              ERROR
          ================================== */}

          {error && (

            <p
              className="
                border-b
                border-red-400/20

                py-4

                text-xs
                text-red-400
              "
            >
              {error}
            </p>

          )}


          {/* ==================================
              WEATHER DATA
          ================================== */}

          {!loading && weather && (

            <section
              className="
                grid
                grid-cols-1
                gap-3
                border-b
                border-[#5cf2a5]/10
                py-5

                min-[460px]:grid-cols-2
              "
            >

              {/* TEMPERATURE */}
              <div
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#2e73ff]/20
                  bg-[linear-gradient(145deg,rgba(5,24,37,0.92),rgba(2,13,20,0.96))]
                  p-4
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]

                  sm:p-5
                "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#5b68ff]/20
                      bg-[#17285b]/25
                      text-[#6078ff]
                      shadow-[0_0_28px_rgba(78,93,255,0.16)]
                    "
                  >
                    <Thermometer size={32} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[clamp(27px,2vw,36px)] font-light leading-none text-white">
                      {weather.temperature}
                      <span className="ml-1 text-xs text-white/35">°C</span>
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.06em] text-white/45">
                      Temperature
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[9px] tracking-[0.12em] text-[#55f2bb]">
                  <span>LIVE</span>
                  <span className="h-px w-8 bg-[#55f2bb]/45" />
                </div>
              </div>

              {/* HUMIDITY */}
              <div
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#2e73ff]/20
                  bg-[linear-gradient(145deg,rgba(5,24,37,0.92),rgba(2,13,20,0.96))]
                  p-5
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
                "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#2f76ff]/20
                      bg-[#0c2b5c]/25
                      text-[#3c7cff]
                      shadow-[0_0_28px_rgba(45,108,255,0.16)]
                    "
                  >
                    <Droplets size={32} strokeWidth={1.75} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[clamp(27px,2vw,36px)] font-light leading-none text-white">
                      {weather.humidity}
                      <span className="ml-1 text-xs text-white/35">%</span>
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.06em] text-white/45">
                      Humidity
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[9px] tracking-[0.12em] text-[#55f2bb]">
                  <span>LIVE</span>
                  <span className="h-px w-8 bg-[#55f2bb]/45" />
                </div>
              </div>

              {/* WIND */}
              <div
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#2e73ff]/20
                  bg-[linear-gradient(145deg,rgba(5,24,37,0.92),rgba(2,13,20,0.96))]
                  p-5
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
                "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#2f76ff]/20
                      bg-[#0c2b5c]/25
                      text-[#3d7fff]
                      shadow-[0_0_28px_rgba(45,108,255,0.16)]
                    "
                  >
                    <Wind size={34} strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[clamp(24px,1.8vw,33px)] font-light leading-none text-white">
                      {weather.windSpeed}
                      <span className="ml-1 text-[10px] text-white/35">km/h</span>
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.06em] text-white/45">
                      Wind Speed
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[9px] tracking-[0.12em] text-[#55f2bb]">
                  <span>LIVE</span>
                  <span className="h-px w-8 bg-[#55f2bb]/45" />
                </div>
              </div>

              {/* RAIN */}
              <div
                className="
                  group
                  relative
                  min-h-[145px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#22b8ff]/20
                  bg-[linear-gradient(145deg,rgba(5,24,37,0.92),rgba(2,13,20,0.96))]
                  p-5
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]
                "
              >
                <div className="flex items-center gap-4">
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#25bfff]/20
                      bg-[#07314b]/25
                      text-[#25bfff]
                      shadow-[0_0_28px_rgba(37,191,255,0.14)]
                    "
                  >
                    <CloudRain size={33} strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[clamp(24px,1.8vw,33px)] font-light leading-none text-white">
                      {weather.rain}
                      <span className="ml-1 text-[10px] text-white/35">mm</span>
                    </p>
                    <p className="mt-2 text-[10px] tracking-[0.06em] text-white/45">
                      Rain
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[9px] tracking-[0.12em] text-[#55f2bb]">
                  <span>LIVE</span>
                  <span className="h-px w-8 bg-[#55f2bb]/45" />
                </div>
              </div>

            </section>

          )}


          {/* ==================================
              AIR QUALITY
          ================================== */}

          <section
            className="
              border-b
              border-[#5cf2a5]/10

              py-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between

                gap-4
              "
            >

              <p
                className="
                  text-[9px]
                  tracking-[0.25em]

                  text-[#5cf2a5]
                "
              >
                AIR QUALITY
              </p>


              <span
                className="
                  text-[8px]
                  tracking-[0.12em]

                  text-white/20
                "
              >
                OPEN-METEO / CAMS
              </span>

            </div>


            <div
              className="
                mt-4
                grid
                grid-cols-1
                gap-3

                min-[460px]:grid-cols-3
              "
            >

              {[
                {
                  label: "AQI",
                  unit: "",
                  value: airQuality?.aqi,
                },
                {
                  label: "PM2.5",
                  unit: "µg/m³",
                  value: airQuality?.pm25,
                },
                {
                  label: "PM10",
                  unit: "µg/m³",
                  value: airQuality?.pm10,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="
                    rounded-xl
                    border
                    border-[#23e7d4]/15
                    bg-[linear-gradient(145deg,rgba(4,25,34,0.9),rgba(2,14,20,0.96))]
                    p-4
                  "
                >
                  <div className="flex items-center gap-3">
                    <Waves
                      size={27}
                      strokeWidth={1.7}
                      className="shrink-0 text-[#21dfd2] drop-shadow-[0_0_8px_rgba(33,223,210,0.28)]"
                    />

                    <div>
                      <p className="text-[9px] tracking-[0.1em] text-white/55">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xl font-light text-white">
                        {item.value ?? "--"}

                        {item.unit && (
                          <span className="ml-1 text-[8px] text-white/35">
                            {item.unit}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[8px] text-[#21dfd2]/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#21dfd2]/70 shadow-[0_0_6px_rgba(33,223,210,0.5)]" />
                    {airQuality ? "CURRENT DATA" : "LOADING DATA"}
                  </div>
                </div>
              ))}

            </div>

          </section>


          {/* ==================================
              24H TEMPERATURE TREND
          ================================== */}

          <section className="pt-5">

            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
              <div>
                <p className="text-[9px] tracking-[0.25em] text-[#5cf2a5]">
                  24H TEMPERATURE TREND
                </p>

                <p className="mt-2 text-[8px] tracking-[0.12em] text-white/25">
                  HOURLY FORECAST / LOCAL TIME
                </p>
              </div>

              {hourlyTemperatures.length > 0 && (
                <div className="text-right">
                  <p className="text-[8px] tracking-[0.12em] text-white/25">
                    RANGE
                  </p>
                  <p className="mt-1 text-[11px] text-white/60">
                    {minimumTemperature.toFixed(1)}° — {maximumTemperature.toFixed(1)}°C
                  </p>
                </div>
              )}
            </div>

            <div
              className="
                relative
                mt-5
                h-[145px]
                overflow-hidden

                sm:h-[150px]
                rounded-xl
                border
                border-[#5cf2a5]/10
                bg-[linear-gradient(180deg,rgba(6,28,27,0.72),rgba(2,12,14,0.82))]
                px-2
                py-3

                sm:px-3
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  opacity-60
                  bg-[linear-gradient(to_bottom,transparent_32%,rgba(92,242,165,0.08)_33%,transparent_34%,transparent_65%,rgba(92,242,165,0.08)_66%,transparent_67%)]
                "
              />

              {hourlyTemperatures.length > 1 ? (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  className="relative z-10 h-[105px] w-full overflow-visible"
                  aria-label="24 hour temperature trend"
                >
                  <defs>
                    <linearGradient
                      id="temperatureArea"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#5cf2a5"
                        stopOpacity="0.24"
                      />
                      <stop
                        offset="100%"
                        stopColor="#5cf2a5"
                        stopOpacity="0"
                      />
                    </linearGradient>

                    <filter id="temperatureGlow">
                      <feGaussianBlur
                        stdDeviation="3"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <polygon
                    points={temperatureAreaPoints}
                    fill="url(#temperatureArea)"
                  />

                  <polyline
                    points={temperaturePoints}
                    fill="none"
                    stroke="#5cf2a5"
                    strokeWidth="2.2"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#temperatureGlow)"
                  />

                  {hourlyTemperatures.map((item, index) => {
                    if (
                      index !== 0 &&
                      index !== hourlyTemperatures.length - 1 &&
                      index % 6 !== 0
                    ) {
                      return null;
                    }

                    const x =
                      chartPadding +
                      (index /
                        Math.max(hourlyTemperatures.length - 1, 1)) *
                        (chartWidth - chartPadding * 2);

                    const y =
                      chartHeight -
                      chartPadding -
                      ((item.temperature - minimumTemperature) /
                        temperatureRange) *
                        (chartHeight - chartPadding * 2);

                    return (
                      <circle
                        key={item.time}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#5cf2a5"
                        stroke="#d9fff0"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="relative z-10 flex h-full items-center justify-center">
                  <span className="text-[9px] tracking-[0.18em] text-white/25">
                    LOADING HOURLY TEMPERATURE DATA...
                  </span>
                </div>
              )}

              {hourlyTemperatures.length > 1 && (
                <div className="relative z-10 mt-1 flex justify-between text-[6px] tracking-[0.04em] text-white/25 sm:text-[7px] sm:tracking-[0.08em]">
                  {[0, 6, 12, 18, 23].map((index) => {
                    const item = hourlyTemperatures[index];

                    if (!item) return <span key={index}>--:--</span>;

                    return (
                      <span key={item.time}>
                        {new Date(item.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-[8px] tracking-[0.14em] text-white/25">
                OPEN-METEO HOURLY FORECAST
              </p>

              <div className="flex items-center gap-2 text-[8px] tracking-[0.12em] text-[#5cf2a5]/65">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5cf2a5] shadow-[0_0_7px_rgba(92,242,165,0.65)]" />
                CURRENT LOCATION
              </div>
            </div>

          </section>

        </aside>

      </section>


      {/* ==================================
          FOOTER
      ================================== */}

      <footer
        className="
          relative
          z-10

          mt-4

          hidden
          justify-between

          text-[8px]
          tracking-[0.2em]

          text-white/20

          sm:flex
        "
      >

        <span>
          AETHER // ENVIRONMENTAL INTELLIGENCE
        </span>

        <span>
          REAL DATA. BRIGHTER TOMORROW.
        </span>

      </footer>

    </main>

  );

}


export default Environment;