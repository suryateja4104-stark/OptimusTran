/**
 * OptiFreight India - Main Application Coordinator (Single City Callouts & Interactive Assumptions)
 */

class TransportPlannerApp {
  constructor() {
    this.transportEngine = new TransportEngine();
    this.elevationRouter = new ElevationRouter();

    this.cities = window.INDIAN_CITIES || [];
    this.corridors = window.PRESET_CORRIDORS || [];
    this.currentCorridor = this.corridors[0]; // Default Hyderabad to Chennai

    this.originCity = this.cities.find(c => c.id === 'hyd');
    this.destCity = this.cities.find(c => c.id === 'che');
    this.activeStrategy = 'balanced';

    this.map = null;
    this.shortestPolyline = null;
    this.ecoPolyline = null;
    this.originMarker = null;
    this.destMarker = null;
    this.cityMarkers = [];
    this.elevationChart = null;

    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.populateCityDropdowns();
      this.initLeafletMap();
      this.initElevationChart();
      this.bindEvents();
      this.loadCorridor(this.currentCorridor.id);
    });
  }

  populateCityDropdowns() {
    const origSelect = document.getElementById('originCitySelect');
    const destSelect = document.getElementById('destCitySelect');

    origSelect.innerHTML = '';
    destSelect.innerHTML = '';

    this.cities.forEach(city => {
      const opt1 = document.createElement('option');
      opt1.value = city.id;
      opt1.innerText = city.name;
      if (city.id === 'hyd') opt1.selected = true;

      const opt2 = document.createElement('option');
      opt2.value = city.id;
      opt2.innerText = city.name;
      if (city.id === 'che') opt2.selected = true;

      origSelect.appendChild(opt1);
      destSelect.appendChild(opt2);
    });
  }

  initLeafletMap() {
    this.map = L.map('leafletMap', {
      zoomControl: true,
      attributionControl: true
    }).setView([15.0, 79.0], 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);
  }

  /**
   * Initialize Chart.js with Staggered City Callout Annotations Plugin (Single Callout Per City)
   */
  initElevationChart() {
    const ctx = document.getElementById('elevationChartCanvas').getContext('2d');
    
    const cityCalloutsPlugin = {
      id: 'cityCallouts',
      afterDatasetsDraw: (chart) => {
        const { ctx, scales: { x, y } } = chart;
        const roadPref = document.getElementById('roadRoutePreference') ? document.getElementById('roadRoutePreference').value : 'eco';
        const routeObj = (roadPref === 'eco') 
          ? this.currentCorridor.elevationData.ecoRoute 
          : this.currentCorridor.elevationData.shortestRoute;
        
        const pts = routeObj.points || [];

        let calloutIndex = 0;
        pts.forEach((pt, index) => {
          if (pt.city) {
            const xPos = x.getPixelForValue(index);
            const yPos = y.getPixelForValue(pt.altitudeMeters);

            const yOffset = (calloutIndex % 2 === 0) ? 22 : 44;
            calloutIndex++;

            ctx.save();
            
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = (roadPref === 'eco') ? '#059669' : '#e11d48';
            ctx.lineWidth = 1.5;
            ctx.moveTo(xPos, yPos);
            ctx.lineTo(xPos, yPos - yOffset);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(xPos, yPos, 5, 0, Math.PI * 2);
            ctx.fillStyle = (roadPref === 'eco') ? '#059669' : '#e11d48';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            const text = pt.city;
            ctx.font = '600 11px Inter';
            const textWidth = ctx.measureText(text).width;
            const padding = 6;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = 20;
            const boxX = xPos - boxWidth / 2;
            const boxY = yPos - yOffset - boxHeight;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
            ctx.fill();
            ctx.strokeStyle = (roadPref === 'eco') ? 'rgba(5, 150, 105, 0.6)' : 'rgba(225, 29, 72, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, xPos, boxY + boxHeight / 2);

            ctx.restore();
          }
        });
      }
    };

    this.elevationChart = new Chart(ctx, {
      type: 'line',
      plugins: [cityCalloutsPlugin],
      data: {
        labels: [],
        datasets: [
          {
            label: 'Shortest Highway (Steep Ghat Climbs)',
            data: [],
            borderColor: '#e11d48',
            backgroundColor: 'rgba(225, 29, 72, 0.12)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 0
          },
          {
            label: 'Eco-Incline Bypass (Gentle Grade)',
            data: [],
            borderColor: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 45 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#334155', font: { family: 'Inter', size: 12, weight: '700' } }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#0f172a',
            bodyColor: '#334155',
            borderColor: '#cbd5e1',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(203, 213, 225, 0.4)' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
            title: { display: true, text: 'Route Distance (km)', color: '#334155', font: { weight: '700' } }
          },
          y: {
            grid: { color: 'rgba(203, 213, 225, 0.4)' },
            ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
            title: { display: true, text: 'Elevation Above Sea Level (meters)', color: '#334155', font: { weight: '700' } }
          }
        }
      }
    });
  }

  bindEvents() {
    // Top Strategy Pills
    const stratBtns = document.querySelectorAll('.strategy-pill');
    stratBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        stratBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeStrategy = e.currentTarget.getAttribute('data-strat');
        this.recalculateAll();
      });
    });

    // Visualizer Tabs (Map vs Elevation Profile)
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

        const targetTabId = e.currentTarget.getAttribute('data-tab');
        e.currentTarget.classList.add('active');
        const targetContent = document.getElementById(targetTabId);
        if (targetContent) {
          targetContent.classList.add('active');
          if (targetTabId === 'mapTab' && this.map) {
            setTimeout(() => this.map.invalidateSize(), 100);
          }
        }
      });
    });

    // Preset dropdown
    const presetSelect = document.getElementById('corridorPreset');
    presetSelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      if (selectedId !== 'custom') {
        this.loadCorridor(selectedId);
      }
    });

    // Highway Strategy selector
    const roadPref = document.getElementById('roadRoutePreference');
    roadPref.addEventListener('change', () => {
      this.updateMapRoutes();
      this.recalculateAll();
    });

    // City Dropdown Selectors
    const origSelect = document.getElementById('originCitySelect');
    const destSelect = document.getElementById('destCitySelect');

    origSelect.addEventListener('change', () => this.handleCustomCitySelection());
    destSelect.addEventListener('change', () => this.handleCustomCitySelection());

    // Vehicle Select
    const vehicleSelect = document.getElementById('vehicleSelect');
    vehicleSelect.addEventListener('change', (e) => {
      const vehicleKey = e.target.value;
      const vehicleObj = this.transportEngine.vehicles[vehicleKey];
      if (vehicleObj) {
        document.getElementById('vehicleMileage').value = vehicleObj.defaultMileageKml;
      }
    });

    // Dimension inputs
    ['dimLength', 'dimWidth', 'dimHeight'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.updateVolumeBadge());
    });

    // Calculate Button
    document.getElementById('btnCalculate').addEventListener('click', () => this.recalculateAll());

    // Swap Locations Button
    document.getElementById('btnSwapLocations').addEventListener('click', () => {
      const tempVal = origSelect.value;
      origSelect.value = destSelect.value;
      destSelect.value = tempVal;
      this.handleCustomCitySelection();
    });

    // Assumptions Modal Events
    const btnAssumptions = document.getElementById('btnAssumptionsModal');
    const assumptionsModal = document.getElementById('assumptionsModal');
    const btnCloseAssumptions = document.getElementById('btnCloseAssumptions');
    const btnSaveAssumptions = document.getElementById('btnSaveAssumptions');
    const btnResetAssumptions = document.getElementById('btnResetAssumptions');

    btnAssumptions.addEventListener('click', () => assumptionsModal.classList.add('active'));
    btnCloseAssumptions.addEventListener('click', () => assumptionsModal.classList.remove('active'));
    
    btnSaveAssumptions.addEventListener('click', () => {
      // Collect custom assumptions
      const engineEffPercent = parseFloat(document.getElementById('assumpEngineEff').value) || 38;
      const tareMassTons = parseFloat(document.getElementById('assumpTareWeight').value) || 12;
      const energyMJ = parseFloat(document.getElementById('assumpFuelEnergy').value) || 38.6;

      this.elevationRouter.updatePhysicsParameters({
        truckEfficiency: engineEffPercent / 100,
        tareWeightTons: tareMassTons,
        fuelEnergyPerLiter: energyMJ
      });

      this.transportEngine.updateAssumptions({
        railSidingFee: document.getElementById('assumpRailSidingFee').value,
        railLinehaulRate: document.getElementById('assumpRailLinehaul').value,
        airHandlingFee: document.getElementById('assumpAirHandlingFee').value,
        airLinehaulRate: document.getElementById('assumpAirLinehaul').value
      });

      assumptionsModal.classList.remove('active');
      this.recalculateAll();
    });

    btnResetAssumptions.addEventListener('click', () => {
      document.getElementById('assumpEngineEff').value = 38;
      document.getElementById('assumpTareWeight').value = 12;
      document.getElementById('assumpFuelEnergy').value = 38.6;
      document.getElementById('assumpRailSidingFee').value = 4500;
      document.getElementById('assumpRailLinehaul').value = 1.45;
      document.getElementById('assumpAirHandlingFee').value = 3500;
      document.getElementById('assumpAirLinehaul').value = 0.048;

      this.elevationRouter.updatePhysicsParameters({
        truckEfficiency: 0.38,
        tareWeightTons: 12,
        fuelEnergyPerLiter: 38.6
      });

      this.transportEngine.updateAssumptions({
        railSidingFee: 4500,
        railLinehaulRate: 1.45,
        airHandlingFee: 3500,
        airLinehaulRate: 0.048
      });

      assumptionsModal.classList.remove('active');
      this.recalculateAll();
    });

    // Show Logic Modal Events
    const btnLogic = document.getElementById('btnShowLogic');
    const logicModal = document.getElementById('logicModal');
    const btnCloseLogic = document.getElementById('btnCloseLogic');
    const btnCloseLogicFooter = document.getElementById('btnCloseLogicFooter');

    btnLogic.addEventListener('click', () => logicModal.classList.add('active'));
    btnCloseLogic.addEventListener('click', () => logicModal.classList.remove('active'));
    btnCloseLogicFooter.addEventListener('click', () => logicModal.classList.remove('active'));

    // Tab Switcher
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'mapTab') {
          setTimeout(() => this.map.invalidateSize(), 100);
        } else if (targetTab === 'elevationTab') {
          this.elevationChart.update();
        }
      });
    });

    // Settings Modal
    const btnSettings = document.getElementById('btnSettingsModal');
    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnCancelSettings = document.getElementById('btnCancelSettings');
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    const mapProviderSelect = document.getElementById('mapProviderSelect');
    const gmapsKeyGroup = document.getElementById('gmapsKeyGroup');

    btnSettings.addEventListener('click', () => settingsModal.classList.add('active'));
    btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    btnCancelSettings.addEventListener('click', () => settingsModal.classList.remove('active'));

    mapProviderSelect.addEventListener('change', (e) => {
      gmapsKeyGroup.style.display = (e.target.value === 'gmaps') ? 'block' : 'none';
    });

    btnSaveSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
  }

  loadCorridor(corridorId) {
    const found = this.corridors.find(c => c.id === corridorId);
    if (!found) return;

    this.currentCorridor = found;
    this.originCity = this.cities.find(c => c.id === found.originId) || this.cities[0];
    this.destCity = this.cities.find(c => c.id === found.destId) || this.cities[1];

    document.getElementById('originCitySelect').value = this.originCity.id;
    document.getElementById('destCitySelect').value = this.destCity.id;

    this.updateMapRoutes();
    this.recalculateAll();
  }

  handleCustomCitySelection() {
    const origId = document.getElementById('originCitySelect').value;
    const destId = document.getElementById('destCitySelect').value;

    this.originCity = this.cities.find(c => c.id === origId);
    this.destCity = this.cities.find(c => c.id === destId);

    const preset = this.corridors.find(c => c.originId === origId && c.destId === destId);
    if (preset) {
      this.currentCorridor = preset;
      document.getElementById('corridorPreset').value = preset.id;
    } else {
      document.getElementById('corridorPreset').value = 'custom';
      
      const dist = window.calculateHaversineDistance(
        this.originCity.lat, this.originCity.lng,
        this.destCity.lat, this.destCity.lng
      );

      this.currentCorridor = {
        id: 'custom',
        name: `${this.originCity.name} ➔ ${this.destCity.name}`,
        origin: this.originCity,
        destination: this.destCity,
        distanceKm: dist,
        elevationData: {
          shortestRoute: {
            name: 'Direct Highway Corridor',
            distanceKm: dist,
            totalClimbMeters: Math.round(Math.abs(this.destCity.alt - this.originCity.alt) * 1.8 + 450),
            maxGrade: 5.5,
            avgGrade: 1.8,
            waypoints: [
              [this.originCity.lat, this.originCity.lng],
              [this.destCity.lat, this.destCity.lng]
            ],
            intermediateCities: [
              { name: 'Midway Transit Hub', alt: Math.round((this.originCity.alt + this.destCity.alt) / 2), lat: (this.originCity.lat + this.destCity.lat)/2, lng: (this.originCity.lng + this.destCity.lng)/2 }
            ],
            points: window.generateElevationProfile(dist, this.originCity.alt, this.destCity.alt, [
              { pos: 0.3, alt: Math.max(this.originCity.alt, this.destCity.alt) + 250, city: 'Mountain Pass' },
              { pos: 0.7, alt: Math.min(this.originCity.alt, this.destCity.alt) + 120, city: 'Valley Hub' }
            ])
          },
          ecoRoute: {
            name: 'Valley Contour Eco Route',
            distanceKm: Math.round(dist * 1.04),
            totalClimbMeters: Math.round(Math.abs(this.destCity.alt - this.originCity.alt) * 0.9 + 180),
            maxGrade: 2.5,
            avgGrade: 0.8,
            waypoints: [
              [this.originCity.lat, this.originCity.lng],
              [this.destCity.lat, this.destCity.lng]
            ],
            intermediateCities: [
              { name: 'Valley Plain Hub', alt: Math.round((this.originCity.alt + this.destCity.alt) / 2 - 20), lat: (this.originCity.lat + this.destCity.lat)/2, lng: (this.originCity.lng + this.destCity.lng)/2 }
            ],
            points: window.generateElevationProfile(Math.round(dist * 1.04), this.originCity.alt, this.destCity.alt, [
              { pos: 0.5, alt: (this.originCity.alt + this.destCity.alt) / 2 + 50, city: 'Bypass Plain' }
            ])
          }
        }
      };
    }

    this.updateMapRoutes();
    this.recalculateAll();
  }

  updateVolumeBadge() {
    const l = parseFloat(document.getElementById('dimLength').value) || 0;
    const w = parseFloat(document.getElementById('dimWidth').value) || 0;
    const h = parseFloat(document.getElementById('dimHeight').value) || 0;

    const vol = Math.round(l * w * h * 10) / 10;
    document.getElementById('volumeSummaryBadge').innerHTML = `
      <i class="fa-solid fa-cube"></i> Total Volume: <strong>${vol} m³</strong>
    `;
    return vol;
  }

  updateMapRoutes() {
    const origin = this.originCity;
    const destination = this.destCity;
    const elevationData = this.currentCorridor.elevationData;
    const roadPref = document.getElementById('roadRoutePreference').value;

    if (this.originMarker) this.map.removeLayer(this.originMarker);
    if (this.destMarker) this.map.removeLayer(this.destMarker);
    if (this.shortestPolyline) this.map.removeLayer(this.shortestPolyline);
    if (this.ecoPolyline) this.map.removeLayer(this.ecoPolyline);
    this.cityMarkers.forEach(m => this.map.removeLayer(m));
    this.cityMarkers = [];

    const originIcon = L.divIcon({
      className: 'custom-pin origin-pin-icon',
      html: `<div style="background: #059669; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px rgba(5, 150, 105, 0.6);"></div>`,
      iconSize: [16, 16]
    });

    const destIcon = L.divIcon({
      className: 'custom-pin dest-pin-icon',
      html: `<div style="background: #e11d48; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px rgba(225, 29, 72, 0.6);"></div>`,
      iconSize: [16, 16]
    });

    this.originMarker = L.marker([origin.lat, origin.lng], { icon: originIcon })
      .addTo(this.map)
      .bindPopup(`<b>Origin:</b> ${origin.name}`);

    this.destMarker = L.marker([destination.lat, destination.lng], { icon: destIcon })
      .addTo(this.map)
      .bindPopup(`<b>Destination:</b> ${destination.name}`);

    const shortestWaypoints = elevationData.shortestRoute.waypoints || this.interpolatePolyline(origin, destination, 0.08);
    const ecoWaypoints = elevationData.ecoRoute.waypoints || this.interpolatePolyline(origin, destination, -0.05);

    this.shortestPolyline = L.polyline(shortestWaypoints, {
      color: '#e11d48',
      weight: (roadPref === 'shortest') ? 6 : 3,
      dashArray: '6, 8',
      opacity: (roadPref === 'shortest') ? 0.95 : 0.4
    }).addTo(this.map).bindPopup(`<b>🔴 Red Dashed Line: Shortest Highway</b><br>NH65/NH16 Direct Cut (Steep Ghat Climbs).`);

    this.ecoPolyline = L.polyline(ecoWaypoints, {
      color: '#059669',
      weight: (roadPref === 'eco') ? 6 : 3,
      opacity: (roadPref === 'eco') ? 0.95 : 0.4
    }).addTo(this.map).bindPopup(`<b>🟢 Green Solid Line: Eco-Incline Bypass</b><br>NH44/NH40 Contour (Gentle Slopes, Fuel Optimized).`);

    const activeRouteObj = (roadPref === 'eco') ? elevationData.ecoRoute : elevationData.shortestRoute;
    if (activeRouteObj.intermediateCities) {
      activeRouteObj.intermediateCities.forEach(city => {
        if (city.lat && city.lng) {
          const pinColor = (roadPref === 'eco') ? '#059669' : '#e11d48';
          const cityIcon = L.divIcon({
            className: 'custom-pin city-pin-icon',
            html: `<div style="background: ${pinColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px ${pinColor};"></div>`,
            iconSize: [12, 12]
          });
          const m = L.marker([city.lat, city.lng], { icon: cityIcon })
            .addTo(this.map)
            .bindPopup(`<b>${city.name}</b><br>Elevation: ${city.alt}m<br>Route: ${activeRouteObj.name}`);
          this.cityMarkers.push(m);
        }
      });
    }

    const bounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ]);
    this.map.fitBounds(bounds, { padding: [50, 50] });

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 100);

    this.updateElevationChart(elevationData);
    this.renderIntermediateCitiesStrip();
  }

  interpolatePolyline(p1, p2, curveFactor) {
    const steps = 30;
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let lat = p1.lat + (p2.lat - p1.lat) * t;
      let lng = p1.lng + (p2.lng - p1.lng) * t;

      const midOffset = Math.sin(t * Math.PI) * curveFactor;
      lat += midOffset * (p2.lng - p1.lng);
      lng -= midOffset * (p2.lat - p1.lat);

      coords.push([lat, lng]);
    }
    return coords;
  }

  updateElevationChart(elevationData) {
    const shortestPts = elevationData.shortestRoute.points;
    const ecoPts = elevationData.ecoRoute.points;

    const labels = shortestPts.map(p => `${p.distanceKm}km`);
    const shortestAlt = shortestPts.map(p => p.altitudeMeters);
    const ecoAlt = ecoPts.map(p => p.altitudeMeters);

    this.elevationChart.data.labels = labels;
    this.elevationChart.data.datasets[0].data = shortestAlt;
    this.elevationChart.data.datasets[1].data = ecoAlt;
    this.elevationChart.update();
  }

  renderIntermediateCitiesStrip() {
    const strip = document.getElementById('intermediateCitiesStrip');
    const roadPref = document.getElementById('roadRoutePreference').value;
    const activeRouteObj = (roadPref === 'eco') 
      ? this.currentCorridor.elevationData.ecoRoute 
      : this.currentCorridor.elevationData.shortestRoute;

    const routeTag = (roadPref === 'eco') ? '🟢 Eco Bypass' : '🔴 Shortest Highway';

    strip.innerHTML = `<strong><i class="fa-solid fa-city"></i> ${routeTag} Cities & Elevations:</strong> `;

    const cities = [
      { name: this.originCity.name.split(',')[0], alt: this.originCity.alt }
    ];

    if (activeRouteObj.intermediateCities) {
      activeRouteObj.intermediateCities.forEach(c => {
        cities.push({ name: c.name, alt: c.alt });
      });
    }

    cities.push({ name: this.destCity.name.split(',')[0], alt: this.destCity.alt });

    cities.forEach(c => {
      const badge = document.createElement('span');
      badge.className = 'city-badge';
      badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${c.name} (${c.alt}m)`;
      strip.appendChild(badge);
    });
  }

  recalculateAll() {
    const payloadTons = parseFloat(document.getElementById('payloadTons').value) || 18;
    const lengthM = parseFloat(document.getElementById('dimLength').value) || 6.0;
    const widthM = parseFloat(document.getElementById('dimWidth').value) || 2.4;
    const heightM = parseFloat(document.getElementById('dimHeight').value) || 2.6;

    const vehicleKey = document.getElementById('vehicleSelect').value;
    const customMileage = parseFloat(document.getElementById('vehicleMileage').value) || 3.2;
    const dieselRateINR = parseFloat(document.getElementById('dieselRate').value) || 94.50;
    const roadPref = document.getElementById('roadRoutePreference').value;

    const elevationData = this.currentCorridor.elevationData;
    
    const ecoComparison = this.elevationRouter.compareRoutes(
      elevationData.shortestRoute,
      elevationData.ecoRoute,
      payloadTons,
      customMileage,
      dieselRateINR
    );

    const selectedRoadProfile = (roadPref === 'eco') ? ecoComparison.eco : ecoComparison.shortest;

    const evaluation = this.transportEngine.evaluateAllModes({
      origin: this.originCity,
      destination: this.destCity,
      distanceKm: selectedRoadProfile.distanceKm,
      payloadTons,
      lengthM,
      widthM,
      heightM,
      vehicleKey,
      customMileageKml: customMileage,
      dieselRateINR,
      optimizationStrategy: this.activeStrategy,
      roadElevationSummary: {
        extraFuelLiters: selectedRoadProfile.analysis.extraFuelLiters,
        totalClimbMeters: selectedRoadProfile.analysis.totalClimbMeters,
        selectedDistanceKm: selectedRoadProfile.distanceKm,
        routeName: selectedRoadProfile.name
      }
    });

    this.updateKpiHeader(evaluation, ecoComparison);
    this.renderModalCards(evaluation);
    this.renderEcoTable(ecoComparison, dieselRateINR);
  }

  updateKpiHeader(evaluation, ecoComparison) {
    document.getElementById('kpiOptMode').innerText = evaluation.recommendedModeName;
    const stratName = this.activeStrategy.charAt(0).toUpperCase() + this.activeStrategy.slice(1);
    document.getElementById('kpiOptSub').innerText = `Strategy: ${stratName} Priority`;

    document.getElementById('kpiDistance').innerText = `${evaluation.distanceKm} km`;
    document.getElementById('kpiDistanceSub').innerText = `${this.originCity.name.split(',')[0]} ➔ ${this.destCity.name.split(',')[0]}`;

    const lowestCostINR = Math.min(...evaluation.modes.map(m => m.costINR));
    document.getElementById('kpiLowestCost').innerText = `₹${lowestCostINR.toLocaleString('en-IN')}`;

    const savedFuel = ecoComparison.recommendation.netFuelSavedLiters;
    const savedMoneyINR = ecoComparison.recommendation.netMoneySavedINR;

    document.getElementById('kpiEcoSavings').innerText = `${savedFuel} L`;
    document.getElementById('kpiEcoSavingsSub').innerText = `Save ₹${savedMoneyINR.toLocaleString('en-IN')} by avoiding climbs`;
  }

  renderModalCards(evaluation) {
    const grid = document.getElementById('modalCardsGrid');
    grid.innerHTML = '';

    evaluation.modes.forEach(mode => {
      const isRecommended = (mode.id === evaluation.recommendedModeId);
      const isRoad = (mode.id === 'road');
      const isRail = (mode.id === 'rail');
      const isAir = (mode.id === 'air');

      let iconClass = 'fa-truck';
      let tagText = `${evaluation.vehicle.name}`;
      if (isRail) { iconClass = 'fa-train'; tagText = 'Indian Railways Siding Freight'; }
      if (isAir) { iconClass = 'fa-plane'; tagText = 'Domestic Air Cargo Express'; }

      const card = document.createElement('div');
      card.className = `modal-card ${isRecommended ? 'is-best' : ''}`;

      card.innerHTML = `
        <div class="card-top">
          <div class="mode-title">
            <div class="mode-icon-box"><i class="fa-solid ${iconClass}"></i></div>
            <div class="mode-name">
              <h3>${mode.name}</h3>
              <span>${tagText}</span>
            </div>
          </div>
          ${isRecommended ? '<span class="best-badge"><i class="fa-solid fa-star"></i> Optimal Mode</span>' : ''}
        </div>

        <div class="cost-display">
          <span class="cost-amount">₹${mode.costINR.toLocaleString('en-IN')}</span>
          <span class="cost-sub">Total Freight</span>
        </div>

        <div class="metric-rows">
          <div class="metric-row">
            <span class="metric-label"><i class="fa-solid fa-clock"></i> Est. Transit Time:</span>
            <span class="metric-val">${mode.timeHours} hrs</span>
          </div>
          <div class="metric-row">
            <span class="metric-label"><i class="fa-solid fa-smog"></i> Carbon Footprint:</span>
            <span class="metric-val">${mode.co2Tons} Tons CO₂</span>
          </div>
          <div class="metric-row">
            <span class="metric-label"><i class="fa-solid fa-calculator"></i> Unit Rate:</span>
            <span class="metric-val">₹${(mode.costINR / evaluation.distanceKm).toFixed(2)} / km</span>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  renderEcoTable(ecoComparison, dieselRateINR) {
    const s = ecoComparison.shortest;
    const e = ecoComparison.eco;
    const rec = ecoComparison.recommendation;

    document.getElementById('ecoBannerText').innerHTML = rec.summaryText;

    const sFuelCost = Math.round(s.totalFuelLiters * dieselRateINR);
    const eFuelCost = Math.round(e.totalFuelLiters * dieselRateINR);

    const sKml = s.analysis.cmvrGhatMileageKml || s.analysis.cmvrPlainsMileageKml || 3.2;
    const eKml = e.analysis.cmvrGhatMileageKml || e.analysis.cmvrPlainsMileageKml || 3.5;

    const tbody = document.getElementById('ecoTableBody');
    tbody.innerHTML = `
      <tr style="background: rgba(225, 29, 72, 0.05);">
        <td><strong>Shortest Highway (Ghat Mountain Cut)</strong></td>
        <td>${s.distanceKm} km</td>
        <td><strong style="color: #e11d48;">${s.analysis.totalClimbMeters} m</strong></td>
        <td>${s.analysis.maxGrade}%</td>
        <td><span title="Ghat Slope Consumption Penalty: +${s.analysis.cmvrExtraFuelPenaltyPercent}% fuel">${sKml} km/L (+${s.analysis.cmvrExtraFuelPenaltyPercent}% Ghat Penalty)</span></td>
        <td>${s.totalFuelLiters} L</td>
        <td>₹${sFuelCost.toLocaleString('en-IN')}</td>
        <td>₹${(sFuelCost + 12000).toLocaleString('en-IN')}</td>
      </tr>
      <tr style="background: rgba(5, 150, 105, 0.08);">
        <td><strong style="color: #059669;">Eco-Incline Bypass (Gentle Contour) ⭐</strong></td>
        <td>${e.distanceKm} km</td>
        <td><strong style="color: #059669;">${e.analysis.totalClimbMeters} m</strong></td>
        <td>${e.analysis.maxGrade}%</td>
        <td><strong style="color: #059669;">${eKml} km/L (Optimized)</strong></td>
        <td><strong style="color: #059669;">${e.totalFuelLiters} L</strong></td>
        <td><strong style="color: #059669;">₹${eFuelCost.toLocaleString('en-IN')}</strong></td>
        <td><strong style="color: #059669;">₹${(eFuelCost + 12000).toLocaleString('en-IN')}</strong></td>
      </tr>
    `;
  }
}

window.app = new TransportPlannerApp();
