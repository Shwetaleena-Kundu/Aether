# AETHER

**Understand places. Plan better journeys.**

AETHER is an interactive urban-intelligence frontend that combines live environmental information and intelligent journey planning for real locations across India.

Rather than presenting weather, air quality, routes, traffic, and road conditions as unrelated tools, AETHER brings them together inside one focused and responsive experience.

> AETHER is a conceptual product, not an official municipal system. Its implemented maps, locations, weather information, routes, traffic data, and incident information come from real services.

## Core Experiences

### Environment Explorer

Select a location on the interactive map to examine its current environmental conditions.

- Current temperature
- Humidity
- Wind speed
- Rain and precipitation
- Air-quality index
- Environmental status indicators
- 24-hour temperature trend
- Location-aware city imagery
- Loading and API error states

### Mobility Planner

Search for a starting point and destination, select a travel mode, and calculate a real route.

- Driving, cycling, and walking modes
- Location search suggestions
- Interactive satellite map
- Click-selected map locations
- Visible GeoJSON route visualization
- Distance and estimated duration
- Estimated arrival time
- Live driving traffic and calculated delay
- Traffic incident information
- Weather-related road status
- Clear Route reset
- Automatic camera fitting around the journey

Traffic and incident information is shown for driving routes, while walking and cycling retain their own route calculations and mobility-focused results.

## Application Flow

```text
Landing Page
      |
      v
AETHER Tool Explorer
      |
      +-- Environment Explorer
      |
      +-- Mobility Planner
```

## Why I Built AETHER

I built AETHER to move beyond static pages and demonstrate how several real services can be combined into one coherent frontend product.

The project demonstrates practical experience with:

- React component architecture
- TypeScript interfaces and typed state
- Multiple asynchronous API requests
- Interactive maps and geographic coordinates
- GeoJSON sources and map layers
- Data transformation and visualization
- Complex state-dependent interfaces
- Loading, error, empty, and reset states
- Responsive layouts
- Motion and interaction design
- Environment-variable security
- Real-world debugging

## Technology Stack

| Technology | Purpose |
| --- | --- |
| React | Component-based interface |
| TypeScript | Type-safe application logic |
| Vite | Development and production build tooling |
| Tailwind CSS | Responsive styling and visual system |
| React Router | Client-side navigation |
| Motion | Interface and entrance animations |
| MapLibre GL | Interactive map rendering |
| React Map GL | React integration for MapLibre |
| MapTiler | Satellite maps and terrain |
| TomTom | Routing, traffic flow, and traffic incidents |
| Open-Meteo | Weather and air-quality information |
| Unsplash | Location-aware imagery |
| Lucide React | Interface icons |
| Oxlint | Source-code linting |

## Routes

| Route | Screen |
| --- | --- |
| `/` | Landing page |
| `/explore` | Tool explorer |
| `/systems/environment` | Environment Explorer |
| `/systems/mobility` | Mobility Planner |

The former `/city` route redirects to `/explore`, and unknown routes safely return users to the landing page.

## Running Locally

### Requirements

- Node.js
- npm
- API keys for MapTiler, TomTom, and Unsplash

### Installation

```bash
git clone https://github.com/Shwetaleena-Kundu/Aether.git
cd Aether
npm install
```

Create a `.env` file in the project root:

```env
VITE_MAPTILER_KEY=your_maptiler_key
VITE_TOMTOM_API_KEY=your_tomtom_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the linter:

```bash
npm run lint
```

The real `.env` file is intentionally excluded from Git. Never commit private API credentials.

## Technical Highlights

### Combining multiple services

The interface transforms data from separate mapping, weather, air-quality, routing, traffic, incident, and image services into a consistent UI.

### Travel-mode-specific routing

Driving, cycling, and walking use separate route calculations rather than displaying the same result for every mode.

### Route visualization

Calculated route coordinates are converted into GeoJSON and rendered through dedicated casing, glow, and primary line layers so the journey remains visible over satellite imagery.

### Traffic intelligence

For driving routes, AETHER compares current and traffic-free travel times to communicate traffic conditions and estimated delay.

### Resilient interface states

The project handles searching, loading, successful results, no incidents, unavailable incident information, invalid inputs, and complete route resets without reloading the application.

### Responsive design

The cinematic landing page, tool selector, environmental workspace, maps, route planner, and result cards adapt across desktop, laptop, tablet, and mobile layouts.

## Challenges Solved

- Displaying calculated GeoJSON routes clearly over satellite maps
- Preventing identical results across different travel modes
- Coordinating several API requests for a single journey
- Handling missing or temporarily unavailable traffic incident data
- Keeping complex floating map controls usable on smaller screens
- Converting clicked map coordinates into useful application state
- Fitting the map camera around dynamically calculated routes
- Protecting API credentials with environment variables
- Refocusing a broad smart-city concept into two understandable user tools

## Real Data and Product Concept

AETHER is the product name and visual concept. It is not the name of a real city and does not claim to be connected to government infrastructure or municipal sensors.

The following implemented information is based on real services:

- Geographic locations and coordinates
- Map imagery
- Weather and air quality
- Driving, cycling, and walking routes
- Route distance and duration
- Traffic conditions and delay
- Traffic incidents

Labels and cinematic visuals are part of AETHER's product presentation.

## Future Improvements

- Route alternatives
- Saved or recently viewed journeys
- Unit and component tests
- Improved keyboard support for map workflows
- Performance monitoring
- Historical environmental comparisons
- Optional user preferences
- Additional verified public datasets

## Author

Developed by [Shwetaleena Kundu](https://github.com/Shwetaleena-Kundu) as a frontend portfolio project focused on React, TypeScript, API integration, interactive mapping, responsive design, and professional UI development.
