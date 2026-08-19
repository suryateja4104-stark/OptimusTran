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
    const start = () => {
      this.populateCityDropdowns();
      this.initLeafletMap();
      this.initElevationChart();
      this.bindEvents();
      this.loadCorridor(this.currentCorridor.id);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start);
    }
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
    const mapEl = document.getElementById('leafletMap');
    if (!mapEl) return;

    if (this.map) {
      try {
        this.map.remove();
      } catch (err) {
        // ignore
      }
      this.map = null;
    }

    try {
      this.map = L.map('leafletMap', {
        zoomControl: true,
        attributionControl: true
      }).setView([15.0, 79.0], 6);

      const primaryTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      const fallbackTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      });

      primaryTiles.on('tileerror', () => {
        if (this.map) {
          try {
            this.map.removeLayer(primaryTiles);
            fallbackTiles.addTo(this.map);
          } catch (e) {}
        }
      });

      primaryTiles.addTo(this.map);

      if (window.ResizeObserver && mapEl) {
        const ro = new ResizeObserver(() => {
          if (this.map) this.map.invalidateSize();
        });
        ro.observe(mapEl);
      }

      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 250);
    } catch (err) {
      console.warn("Leaflet init error:", err);
    }
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
            if (ctx.roundRect) {
              ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
            } else {
              ctx.rect(boxX, boxY, boxWidth, boxHeight);
            }
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
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const selectedId = e.target.value;
        if (selectedId !== 'custom') {
          this.loadCorridor(selectedId);
        }
      });
    }

    // Highway Strategy selector & Mesh Segments Inputs
    const roadPref = document.getElementById('roadRoutePreference');
    if (roadPref) {
      roadPref.addEventListener('change', () => {
        this.updateMapRoutes();
        this.recalculateAll();
      });
    }

    const segInputSidebar = document.getElementById('numSegmentsInput');
    const segInputTable = document.getElementById('numSegmentsTableInput');

    const handleSegChange = (val) => {
      const num = Math.min(30, Math.max(2, parseInt(val) || 10));
      if (segInputSidebar) segInputSidebar.value = num;
      if (segInputTable) segInputTable.value = num;
      this.recalculateAll();
    };

    if (segInputSidebar) {
      segInputSidebar.addEventListener('input', (e) => handleSegChange(e.target.value));
    }
    if (segInputTable) {
      segInputTable.addEventListener('input', (e) => handleSegChange(e.target.value));
    }

    // City Dropdown Selectors
    const origSelect = document.getElementById('originCitySelect');
    const destSelect = document.getElementById('destCitySelect');

    if (origSelect) {
      origSelect.addEventListener('change', () => this.handleCustomCitySelection());
      origSelect.addEventListener('input', () => this.handleCustomCitySelection());
    }
    if (destSelect) {
      destSelect.addEventListener('change', () => this.handleCustomCitySelection());
      destSelect.addEventListener('input', () => this.handleCustomCitySelection());
    }

    // Vehicle Select
    const vehicleSelect = document.getElementById('vehicleSelect');
    if (vehicleSelect) {
      vehicleSelect.addEventListener('change', (e) => {
        const vehicleKey = e.target.value;
        const vehicleObj = this.transportEngine.vehicles[vehicleKey];
        if (vehicleObj) {
          const milInput = document.getElementById('vehicleMileage');
          if (milInput) milInput.value = vehicleObj.defaultMileageKml;
        }
      });
    }

    // Dimension inputs
    ['dimLength', 'dimWidth', 'dimHeight'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.updateVolumeBadge());
    });

    // Calculate Button
    const btnCalculate = document.getElementById('btnCalculate');
    if (btnCalculate) {
      btnCalculate.addEventListener('click', () => this.recalculateAll());
    }

    // Swap Locations Button
    const btnSwap = document.getElementById('btnSwapLocations');
    if (btnSwap && origSelect && destSelect) {
      btnSwap.addEventListener('click', () => {
        const tempVal = origSelect.value;
        origSelect.value = destSelect.value;
        destSelect.value = tempVal;
        this.handleCustomCitySelection();
      });
    }

    // Assumptions Modal Events
    const btnAssumptions = document.getElementById('btnAssumptionsModal');
    const assumptionsModal = document.getElementById('assumptionsModal');
    const btnCloseAssumptions = document.getElementById('btnCloseAssumptions');
    const btnSaveAssumptions = document.getElementById('btnSaveAssumptions');
    const btnResetAssumptions = document.getElementById('btnResetAssumptions');

    if (btnAssumptions && assumptionsModal) {
      btnAssumptions.addEventListener('click', () => assumptionsModal.classList.add('active'));
    }
    if (btnCloseAssumptions && assumptionsModal) {
      btnCloseAssumptions.addEventListener('click', () => assumptionsModal.classList.remove('active'));
    }
    
    if (btnSaveAssumptions && assumptionsModal) {
      btnSaveAssumptions.addEventListener('click', () => {
        const engineEffPercent = parseFloat(document.getElementById('assumpEngineEff')?.value) || 38;
        const tareMassTons = parseFloat(document.getElementById('assumpTareWeight')?.value) || 12;
        const energyMJ = parseFloat(document.getElementById('assumpFuelEnergy')?.value) || 38.6;

        this.elevationRouter.updatePhysicsParameters({
          truckEfficiency: engineEffPercent / 100,
          tareWeightTons: tareMassTons,
          fuelEnergyPerLiter: energyMJ
        });

        this.transportEngine.updateAssumptions({
          railSidingFee: document.getElementById('assumpRailSidingFee')?.value,
          railLinehaulRate: document.getElementById('assumpRailLinehaul')?.value,
          airHandlingFee: document.getElementById('assumpAirHandlingFee')?.value,
          airLinehaulRate: document.getElementById('assumpAirLinehaul')?.value
        });

        assumptionsModal.classList.remove('active');
        this.recalculateAll();
      });
    }

    if (btnResetAssumptions && assumptionsModal) {
      btnResetAssumptions.addEventListener('click', () => {
        if (document.getElementById('assumpEngineEff')) document.getElementById('assumpEngineEff').value = 38;
        if (document.getElementById('assumpTareWeight')) document.getElementById('assumpTareWeight').value = 12;
        if (document.getElementById('assumpFuelEnergy')) document.getElementById('assumpFuelEnergy').value = 38.6;
        if (document.getElementById('assumpRailSidingFee')) document.getElementById('assumpRailSidingFee').value = 4500;
        if (document.getElementById('assumpRailLinehaul')) document.getElementById('assumpRailLinehaul').value = 1.45;
        if (document.getElementById('assumpAirHandlingFee')) document.getElementById('assumpAirHandlingFee').value = 3500;
        if (document.getElementById('assumpAirLinehaul')) document.getElementById('assumpAirLinehaul').value = 0.048;

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
    }

    // Show Logic Modal Events
    const btnLogic = document.getElementById('btnShowLogic');
    const logicModal = document.getElementById('logicModal');
    const btnCloseLogic = document.getElementById('btnCloseLogic');
    const btnCloseLogicFooter = document.getElementById('btnCloseLogicFooter');

    if (btnLogic && logicModal) {
      btnLogic.addEventListener('click', () => logicModal.classList.add('active'));
    }
    if (btnCloseLogic && logicModal) {
      btnCloseLogic.addEventListener('click', () => logicModal.classList.remove('active'));
    }
    if (btnCloseLogicFooter && logicModal) {
      btnCloseLogicFooter.addEventListener('click', () => logicModal.classList.remove('active'));
    }

    // Settings Modal
    const btnSettings = document.getElementById('btnSettingsModal');
    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const btnCancelSettings = document.getElementById('btnCancelSettings');
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    const mapProviderSelect = document.getElementById('mapProviderSelect');
    const gmapsKeyGroup = document.getElementById('gmapsKeyGroup');

    if (btnSettings && settingsModal) {
      btnSettings.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (btnCloseSettings && settingsModal) {
      btnCloseSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
    if (btnCancelSettings && settingsModal) {
      btnCancelSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }

    if (mapProviderSelect && gmapsKeyGroup) {
      mapProviderSelect.addEventListener('change', (e) => {
        gmapsKeyGroup.style.display = (e.target.value === 'gmaps') ? 'block' : 'none';
      });
    }

    if (btnSaveSettings && settingsModal) {
      btnSaveSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
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
    let origId = document.getElementById('originCitySelect').value;
    let destId = document.getElementById('destCitySelect').value;

    if (!origId || !destId) return;

    if (origId === destId) {
      const otherCity = this.cities.find(c => c.id !== origId);
      if (otherCity) {
        destId = otherCity.id;
        document.getElementById('destCitySelect').value = destId;
      }
    }

    this.originCity = this.cities.find(c => c.id === origId) || this.cities[0];
    this.destCity = this.cities.find(c => c.id === destId) || this.cities[1];

    const preset = this.corridors.find(c => c.originId === origId && c.destId === destId);
    const corridorPresetSelect = document.getElementById('corridorPreset');
    if (preset) {
      this.currentCorridor = preset;
      if (corridorPresetSelect) corridorPresetSelect.value = preset.id;
    } else {
      if (corridorPresetSelect) corridorPresetSelect.value = 'custom';
      
      const dist = Math.max(10, window.calculateHaversineDistance(
        this.originCity.lat, this.originCity.lng,
        this.destCity.lat, this.destCity.lng
      ));

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

  async fetchOsrmRoute(waypoints) {
    try {
      const locStr = waypoints.map(w => `${w[1]},${w[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${locStr}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
        return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      }
    } catch (e) {
      console.warn("OSRM routing API fallback:", e);
    }
    return null;
  }

  async updateMapRoutes() {
    if (!this.map) return;
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

    let shortestInput = [[origin.lat, origin.lng], [destination.lat, destination.lng]];
    if (elevationData.shortestRoute.waypoints && elevationData.shortestRoute.waypoints.length >= 2) {
      shortestInput = elevationData.shortestRoute.waypoints;
    }

    let ecoInput = [[origin.lat, origin.lng], [destination.lat, destination.lng]];
    if (elevationData.ecoRoute.waypoints && elevationData.ecoRoute.waypoints.length >= 2) {
      ecoInput = elevationData.ecoRoute.waypoints;
    }

    const realShortestCoords = await this.fetchOsrmRoute(shortestInput) || shortestInput;
    const realEcoCoords = await this.fetchOsrmRoute(ecoInput) || ecoInput;

    this.shortestPolyline = L.polyline(realShortestCoords, {
      color: '#e11d48',
      weight: (roadPref === 'shortest') ? 6 : 3,
      dashArray: '6, 8',
      opacity: (roadPref === 'shortest') ? 0.95 : 0.4
    }).addTo(this.map).bindPopup(`<b>🔴 Red Line: Shortest Highway</b><br>Snaps to exact National Highway road geometry.`);

    this.ecoPolyline = L.polyline(realEcoCoords, {
      color: '#059669',
      weight: (roadPref === 'eco') ? 6 : 3,
      opacity: (roadPref === 'eco') ? 0.95 : 0.4
    }).addTo(this.map).bindPopup(`<b>🟢 Green Line: Eco-Incline Route</b><br>Snaps to exact Bypass Expressway road geometry.`);

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
      const isHighTraffic = (c.alt > 350 || c.name.includes('Pass') || c.name.includes('Summit'));
      const trafficDot = isHighTraffic ? '🔴 High Traffic' : '🟢 Low Traffic';
      badge.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${c.name} (${c.alt}m) · <small>${trafficDot}</small>`;
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
    const customSegments = parseInt(document.getElementById('numSegmentsInput').value) || 10;

    const elevationData = this.currentCorridor.elevationData;
    
    const ecoComparison = this.elevationRouter.compareRoutes(
      elevationData.shortestRoute,
      elevationData.ecoRoute,
      payloadTons,
      customMileage,
      dieselRateINR,
      '6axle',
      customSegments,
      this.originCity ? this.originCity.name : 'Origin',
      this.destCity ? this.destCity.name : 'Destination'
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

    this.renderSegmentedTable(ecoComparison);
  }

  renderSegmentedTable(ecoComparison) {
    const segData = ecoComparison.segmentedBreakdown;
    if (!segData || !segData.segmentedLegs) return;

    const kpiContainer = document.getElementById('segmentKpiPills');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <span class="segment-pill"><i class="fa-solid fa-layer-group"></i> <strong>${segData.numSegments}</strong> Town Legs</span>
        <span class="segment-pill traffic-pill-high"><i class="fa-solid fa-triangle-exclamation"></i> <strong>${segData.highTrafficCount}</strong> High Traffic</span>
        <span class="segment-pill traffic-pill-low"><i class="fa-solid fa-circle-check"></i> <strong>${segData.lowTrafficCount}</strong> Low Traffic</span>
        <span class="segment-pill segment-pill-savings"><i class="fa-solid fa-piggy-bank"></i> Total Savings: <strong>${segData.totalSegSavingsLiters} L</strong> (₹${segData.totalSegSavingsINR.toLocaleString('en-IN')})</span>
      `;
    }

    const tbody = document.getElementById('segmentTableBody');
    if (!tbody) return;

    tbody.innerHTML = segData.segmentedLegs.map(leg => {
      const trafficBadgeClass = leg.trafficStatus === 'HIGH' ? 'traffic-badge-high' : 'traffic-badge-low';
      const trafficIcon = leg.trafficStatus === 'HIGH' ? 'fa-triangle-exclamation' : 'fa-circle-check';

      return `
        <tr>
          <td><strong>#${leg.legNumber}</strong></td>
          <td><strong>${leg.legName}</strong></td>
          <td>${leg.distanceKm} km</td>
          <td><strong>${leg.avgElevationMeters} m</strong></td>
          <td><span class="traffic-badge ${trafficBadgeClass}"><i class="fa-solid ${trafficIcon}"></i> ${leg.trafficStatus} (${leg.trafficReason})</span></td>
          <td><i class="fa-solid fa-clock"></i> ${leg.fastestTimeHours}h | <i class="fa-solid fa-gas-pump"></i> ${leg.fastestFuelLiters} L</td>
          <td><strong style="color: #059669;"><i class="fa-solid fa-clock"></i> ${leg.ecoTimeHours}h | <i class="fa-solid fa-gas-pump"></i> ${leg.ecoFuelLiters} L</strong></td>
          <td><strong style="color: #059669;">+${leg.segFuelSavingsLiters} L (₹${leg.segMoneySavingsINR.toLocaleString('en-IN')})</strong></td>
        </tr>
      `;
    }).join('');
  }
}

window.app = new TransportPlannerApp();
