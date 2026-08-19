# 🚛 OptiFreight India | Multi-Modal & Elevation Logistics Planner

OptiFreight India is a web-based logistics optimization engine designed to evaluate multi-modal freight costs (Road, Rail, Air), calculate vertical elevation fuel penalties, and provide leg-by-leg city/town route breakdowns with traffic congestion flagging across Indian transport corridors.

---

## 🌟 Key Platform Features

### 1. Multi-Modal Freight Breakdown
- **Road Freight:** Vehicle-specific CMVR fuel consumption, fleet base rates, weight-distance rates, and incline ascent penalties.
- **Indian Railways Siding Freight:** Rake siding charges, bulk tonnage tier discounts (>25T), and rail linehaul rates.
- **Domestic Air Cargo Express:** Volumetric weight ratio conversion ($167\text{ kg/m}^3$), handling fees, and high-speed linehaul rates.
- **Optimization Strategies:** Instant evaluation based on **Balanced**, **Cheapest**, **Fastest**, or **Eco (CO₂)** priorities.

### 2. Eco-Incline Physics & CMVR Fuel Model
- **Potential Energy Physics:** Calculates gravitational potential energy work ($W = m \cdot g \cdot h$) required to lift heavy truck payloads over mountain passes.
- **Empirical CMVR Equations:** Implements post-2018 Motor Vehicles Act empirical fuel models for 6-axle articulated trailers ($C_3S_3$ up to 49t–52t GVW) and 2/3-axle rigid trucks.
- **Ghat Fuel Penalties:** Dynamically measures slope grade percentage ($S$) and calculates exact diesel penalties ($L$ and $₹$) for climbing steep highways.

### 3. Configurable Town Mesh & Segmented Breakdown
- **Leg-by-Leg Mesh:** Divides any origin-to-destination corridor into configurable sub-segments (from 2 to 30 town legs, default 10).
- **Average Elevation:** Calculates average altitude ($\text{m}$) for each intermediate town segment.
- **Fastest vs. Fuel-Efficient Comparison:** Side-by-side transit time ($\text{hrs}$) and fuel consumption ($L$) for both direct highway cuts and gentle contour bypasses.

### 4. High & Low Traffic Area Flagging
- **🔴 High Traffic Zone:** Automatically flags mountain ghat passes ($>3.5\%$ slope), urban core freight corridors, and narrow highway bottlenecks.
- **🟢 Low Traffic Zone:** Identifies open expressway bypasses, ring roads, and low-density contour routes.
- **Integrated Callouts:** Displayed across map popups, top city strips, and the detailed town breakdown table.

### 5. Interactive Route Visualizer
- **Leaflet Map:** Displays origin/destination markers, intermediate city pins, shortest highway route (red dashed line), and eco bypass route (green solid line).
- **Elevation Profile Chart:** Chart.js elevation area graph with city altitude callouts.

---

## 🚀 How to Run the Platform

OptiFreight India requires **no server installation or build steps**. It runs directly in any modern browser.

### Option 1: Desktop Shortcut
- Double-click the **OptiFreight India** shortcut created on your Desktop.

### Option 2: Direct File Launch
- Open [`index.html`](file:///c:/Users/surya/Documents/Transport%20planner/index.html) in your browser (Chrome, Edge, Firefox, Brave, Safari).

---

## 📖 How to Use the Platform (Step-by-Step)

### Step 1: Select Origin & Destination
1. In the left **Sidebar Panel**, choose your **Origin City** (Point A) and **Destination City** (Point B).
2. Click **Swap Cities** to reverse the route, or pick from **Preset Corridors** (e.g. *Hyderabad ➔ Chennai*, *Mumbai ➔ Pune*).

### Step 2: Set Fleet & Cargo Specifications
1. **Fleet Vehicle Type:** Select from Heavy 12-Wheeler (25T), Standard Rigid (16T), Multi-Axle Trailer (40T), LCV (6T), or EV Heavy Truck.
2. **Mileage & Diesel Rate:** Adjust baseline CMVR mileage ($\text{km/L}$) and local diesel price ($₹/\text{L}$).
3. **Cargo Weight & Sizing:** Enter cargo payload weight ($\text{Tons}$) and dimensions ($L \times W \times H \text{ meters}$) to automatically compute volumetric cargo metrics.

### Step 3: Configure Incline & Mesh Segments
1. **Highway Strategy:** Choose between **Eco-Incline Bypass** or **Shortest Distance Highway**.
2. **Town Mesh Segments:** Adjust the numeric input box (2 to 30 segments) in the sidebar or directly in the table header bar to change the leg resolution.
3. Click **Calculate & Optimize Routes**.

### Step 4: Review Multi-Modal & Segmented Results
1. **KPI Header Cards:** Inspect the recommended mode, total distance, lowest freight cost, and eco diesel savings.
2. **Multi-Modal Cards:** Compare total freight cost ($₹$), transit time ($\text{hrs}$), and CO₂ emissions across Road, Rail, and Air.
3. **Segmented Town Breakdown Table:** Examine leg-by-leg distance, average elevation, traffic status (🔴 High vs. 🟢 Low Traffic), fastest route specs, fuel-efficient route specs, and leg fuel savings ($L$ & $₹$).

### Step 5: Tweak Operational Benchmarks
1. Click **Tweak Benchmarks & Assumptions** in the top navigation bar to adjust engine thermal efficiency ($38\%$), empty truck weight ($12\text{T}$), fuel energy density ($38.6\text{ MJ/L}$), or mode rate cards.
2. Click **Calculation Logic** to review detailed mathematical formulas.

---

## 📁 Codebase Architecture

```
Transport planner/
├── index.html           # Main HTML dashboard, layout grids, and modals
├── app.js               # Application coordinator, event listeners & UI renderers
├── transport-engine.js  # Freight calculation engine (Road, Rail, Air mode scoring)
├── elevation-router.js  # Dynamic elevation physics, CMVR fuel models & leg breakdown
├── city-data.js         # Indian cities coordinate database & preset highway corridors
├── styles.css           # Styling with glassmorphism, responsive tables & traffic badges
└── README.md            # Platform documentation
```

---

## 🛠️ Technology Stack
- **Frontend:** Vanilla HTML5, JavaScript (ES6+), Vanilla CSS3.
- **Mapping:** [Leaflet.js](https://leafletjs.com/) with OpenStreetMap tiles.
- **Charts:** [Chart.js](https://www.chartjs.org/) for elevation profiling.
- **Icons:** [FontAwesome 6](https://fontawesome.com/).
- **Typography:** Inter, JetBrains Mono, Outfit (Google Fonts).
