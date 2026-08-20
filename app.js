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

    if (origSelect && destSelect) {
      origSelect.innerHTML = '';
      destSelect.innerHTML = '';

      this.cities.forEach(city => {
        const opt1 = document.createElement('option');
        opt1.value = city.id;
        opt1.textContent = city.name;
        if (city.id === (this.originCity ? this.originCity.id : 'hyd')) opt1.selected = true;

        const opt2 = document.createElement('option');
        opt2.value = city.id;
        opt2.textContent = city.name;
        if (city.id === (this.destCity ? this.destCity.id : 'che')) opt2.selected = true;

        origSelect.appendChild(opt1);
        destSelect.appendChild(opt2);
      });
    }

    this.setupCitySearchboxes();
  }

  setupCitySearchboxes() {
    this.initSearchbox('originCityInput', 'originCityResults', 'btnClearOrigin', 'originCitySelect', (city) => {
      this.originCity = city;
      this.handleCustomCitySelection();
    });

    this.initSearchbox('destCityInput', 'destCityResults', 'btnClearDest', 'destCitySelect', (city) => {
      this.destCity = city;
      this.handleCustomCitySelection();
    });

    this.syncSearchboxValues();
  }

  syncSearchboxValues() {
    const origInput = document.getElementById('originCityInput');
    const destInput = document.getElementById('destCityInput');
    const btnClearOrig = document.getElementById('btnClearOrigin');
    const btnClearDest = document.getElementById('btnClearDest');

    if (origInput && this.originCity) {
      origInput.value = this.originCity.name;
      if (btnClearOrig) btnClearOrig.style.display = 'block';
    }
    if (destInput && this.destCity) {
      destInput.value = this.destCity.name;
      if (btnClearDest) btnClearDest.style.display = 'block';
    }
  }

  initSearchbox(inputId, resultsId, clearBtnId, hiddenSelectId, onSelectCallback) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);
    const clearBtn = document.getElementById(clearBtnId);
    const hiddenSelect = document.getElementById(hiddenSelectId);

    if (!input || !resultsContainer) return;

    let focusedIndex = -1;

    const renderResults = (searchTerm = '') => {
      const query = searchTerm.trim().toLowerCase();
      resultsContainer.innerHTML = '';
      focusedIndex = -1;

      const filtered = this.cities.filter(c => {
        if (!query) return true;
        return c.name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query);
      });

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `
          <div class="city-dropdown-item" style="cursor: default; color: var(--text-muted);">
            <span>No matching Indian city found</span>
          </div>
        `;
        resultsContainer.classList.add('active');
        return;
      }

      filtered.forEach((city) => {
        const item = document.createElement('div');
        item.className = 'city-dropdown-item';

        const isSelected = (hiddenSelect && hiddenSelect.value === city.id);
        if (isSelected) item.classList.add('selected');

        let displayName = city.name;
        if (query) {
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          displayName = city.name.replace(regex, '<mark>$1</mark>');
        }

        item.innerHTML = `
          <div class="city-title"><i class="fa-solid fa-location-dot" style="color: var(--accent-blue);"></i> ${displayName}</div>
          <span class="city-alt-badge"><i class="fa-solid fa-mountain"></i> ${city.alt}m</span>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectCity(city);
        });

        resultsContainer.appendChild(item);
      });

      resultsContainer.classList.add('active');
    };

    const selectCity = (city) => {
      input.value = city.name;
      if (hiddenSelect) hiddenSelect.value = city.id;
      if (clearBtn) clearBtn.style.display = 'block';
      resultsContainer.classList.remove('active');
      onSelectCallback(city);
    };

    input.addEventListener('focus', () => {
      renderResults(input.value);
    });

    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
      renderResults(val);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        clearBtn.style.display = 'none';
        input.focus();
        renderResults('');
      });
    }

    input.addEventListener('keydown', (e) => {
      const items = resultsContainer.querySelectorAll('.city-dropdown-item');
      if (!items.length || !resultsContainer.classList.contains('active')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusedIndex = (focusedIndex + 1) % items.length;
        updateFocus(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusedIndex = (focusedIndex - 1 + items.length) % items.length;
        updateFocus(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && items[focusedIndex]) {
          items[focusedIndex].click();
        }
      } else if (e.key === 'Escape') {
        resultsContainer.classList.remove('active');
      }
    });

    const updateFocus = (items) => {
      items.forEach((item, i) => {
        if (i === focusedIndex) {
          item.classList.add('focused');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('focused');
        }
      });
    };

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('active');
      }
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

        // 1. Render Segment Highlight Band if active
        if (this.selectedSegment && pts.length > 0) {
          const { segStartKm, segEndKm, legNumber, legName } = this.selectedSegment;

          let startIdx = pts.findIndex(p => p.distanceKm >= segStartKm);
          let endIdx = pts.findIndex(p => p.distanceKm >= segEndKm);
          if (startIdx < 0) startIdx = 0;
          if (endIdx < 0 || endIdx < startIdx) endIdx = pts.length - 1;

          const xStart = x.getPixelForValue(startIdx);
          const xEnd = x.getPixelForValue(endIdx);
          const yTop = chart.chartArea.top;
          const yBottom = chart.chartArea.bottom;

          ctx.save();
          ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
          ctx.fillRect(xStart, yTop, Math.max(4, xEnd - xStart), yBottom - yTop);

          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.moveTo(xStart, yTop);
          ctx.lineTo(xStart, yBottom);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(xEnd, yTop);
          ctx.lineTo(xEnd, yBottom);
          ctx.stroke();

          ctx.setLineDash([]);
          const labelText = `📍 Selected Stretch: Leg #${legNumber} (${legName})`;
          ctx.font = 'bold 11px Inter, sans-serif';
          const tw = ctx.measureText(labelText).width;
          const px = Math.min(chart.chartArea.right - 80, Math.max(chart.chartArea.left + 80, (xStart + xEnd) / 2));
          const py = yTop + 14;

          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(px - tw / 2 - 8, py - 10, tw + 16, 20, 10);
          } else {
            ctx.rect(px - tw / 2 - 8, py - 10, tw + 16, 20);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, px, py);
          ctx.restore();
        }

        // 2. Render 4-level staggered City Callout Tags for ALL Cities
        const staggeredHeights = [20, 42, 64, 86];
        let calloutIndex = 0;

        pts.forEach((pt, index) => {
          if (pt.city) {
            const xPos = x.getPixelForValue(index);
            const yPos = y.getPixelForValue(pt.altitudeMeters);

            const yOffset = staggeredHeights[calloutIndex % staggeredHeights.length];
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
            ctx.font = '600 11px Inter, sans-serif';
            const textWidth = ctx.measureText(text).width;
            const padding = 6;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = 20;
            const boxX = xPos - boxWidth / 2;
            const boxY = yPos - yOffset - boxHeight;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
            } else {
              ctx.rect(boxX, boxY, boxWidth, boxHeight);
            }
            ctx.fill();
            ctx.strokeStyle = (roadPref === 'eco') ? 'rgba(5, 150, 105, 0.7)' : 'rgba(225, 29, 72, 0.7)';
            ctx.lineWidth = 1.2;
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
    if (btnSwap) {
      btnSwap.addEventListener('click', () => {
        const tempCity = this.originCity;
        this.originCity = this.destCity;
        this.destCity = tempCity;

        const origSelect = document.getElementById('originCitySelect');
        const destSelect = document.getElementById('destCitySelect');
        if (origSelect && destSelect) {
          origSelect.value = this.originCity.id;
          destSelect.value = this.destCity.id;
        }

        this.syncSearchboxValues();
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

  clearSegmentHighlight() {
    this.selectedSegment = null;
    if (this.segmentHighlightLayer && this.map) {
      try {
        this.map.removeLayer(this.segmentHighlightLayer);
      } catch (e) {}
      this.segmentHighlightLayer = null;
    }
    if (this.segmentPopup && this.map) {
      try {
        this.map.removeLayer(this.segmentPopup);
      } catch (e) {}
      this.segmentPopup = null;
    }
    if (this.map) {
      try {
        this.map.closePopup();
        this.map.eachLayer(layer => {
          if (layer instanceof L.Popup) {
            this.map.removeLayer(layer);
          }
        });
      } catch (e) {}
    }
    const tbody = document.getElementById('segmentTableBody');
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('segment-row-selected'));
    }
    if (this.elevationChart) {
      this.elevationChart.update();
    }
  }

  generateDynamicIntermediateCities(origin, dest) {
    if (!origin || !dest) return [];
    const dx = dest.lng - origin.lng;
    const dy = dest.lat - origin.lat;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return [];

    const candidates = [];
    (this.cities || window.INDIAN_CITIES || []).forEach(c => {
      if (c.id === origin.id || c.id === dest.id) return;
      const vx = c.lng - origin.lng;
      const vy = c.lat - origin.lat;
      const t = (vx * dx + vy * dy) / lenSq;
      const projX = origin.lng + t * dx;
      const projY = origin.lat + t * dy;
      const perpDist = Math.sqrt(Math.pow(c.lng - projX, 2) + Math.pow(c.lat - projY, 2));

      if (t > 0.08 && t < 0.92 && perpDist < 3.8) {
        candidates.push({ ...c, t, perpDist });
      }
    });

    candidates.sort((a, b) => a.t - b.t);
    return candidates;
  }

  loadCorridor(corridorId) {
    const found = this.corridors.find(c => c.id === corridorId);
    if (!found) return;

    this.clearSegmentHighlight();

    this.currentCorridor = found;
    this.originCity = this.cities.find(c => c.id === found.originId) || this.cities[0];
    this.destCity = this.cities.find(c => c.id === found.destId) || this.cities[1];

    const origSelect = document.getElementById('originCitySelect');
    const destSelect = document.getElementById('destCitySelect');
    if (origSelect) origSelect.value = this.originCity.id;
    if (destSelect) destSelect.value = this.destCity.id;

    this.syncSearchboxValues();

    this.recalculateAll();
    this.updateMapRoutes();
  }

  handleCustomCitySelection() {
    this.clearSegmentHighlight();

    let origId = document.getElementById('originCitySelect')?.value;
    let destId = document.getElementById('destCitySelect')?.value;

    if (this.originCity && this.originCity.id) origId = this.originCity.id;
    if (this.destCity && this.destCity.id) destId = this.destCity.id;

    if (!origId || !destId) return;

    if (origId === destId) {
      const otherCity = this.cities.find(c => c.id !== origId);
      if (otherCity) {
        destId = otherCity.id;
        this.destCity = otherCity;
        const destSelect = document.getElementById('destCitySelect');
        if (destSelect) destSelect.value = destId;
      }
    }

    this.originCity = this.cities.find(c => c.id === origId) || this.cities[0];
    this.destCity = this.cities.find(c => c.id === destId) || this.cities[1];
    this.syncSearchboxValues();

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

      const corridorCities = this.generateDynamicIntermediateCities(this.originCity, this.destCity);

      const shortestWaypoints = [[this.originCity.lat, this.originCity.lng]];
      const ecoWaypoints = [[this.originCity.lat, this.originCity.lng]];
      const profileWaypointsShortest = [];
      const profileWaypointsEco = [];
      const intermediateCitiesList = [];

      if (corridorCities.length > 0) {
        corridorCities.forEach((c) => {
          shortestWaypoints.push([c.lat, c.lng]);
          ecoWaypoints.push([c.lat + 0.04, c.lng - 0.04]);
          profileWaypointsShortest.push({ pos: c.t, alt: c.alt, city: `${c.name.split(',')[0]} (${c.alt}m)` });
          profileWaypointsEco.push({ pos: c.t, alt: Math.max(10, c.alt - 25), city: `${c.name.split(',')[0]} (${Math.max(10, c.alt - 25)}m)` });
          intermediateCitiesList.push({ name: c.name.split(',')[0], alt: c.alt, lat: c.lat, lng: c.lng });
        });
      } else {
        const midLat = (this.originCity.lat + this.destCity.lat) / 2;
        const midLng = (this.originCity.lng + this.destCity.lng) / 2;
        const dLat = this.destCity.lat - this.originCity.lat;
        const dLng = this.destCity.lng - this.originCity.lng;

        shortestWaypoints.push([midLat - dLng * 0.04, midLng + dLat * 0.04]);
        ecoWaypoints.push([midLat + dLng * 0.12, midLng - dLat * 0.12]);

        const midAlt = Math.round((this.originCity.alt + this.destCity.alt) / 2);
        profileWaypointsShortest.push({ pos: 0.5, alt: midAlt + 140, city: `Midway Pass (${midAlt + 140}m)` });
        profileWaypointsEco.push({ pos: 0.5, alt: midAlt + 30, city: `Bypass Hub (${midAlt + 30}m)` });
        intermediateCitiesList.push({ name: 'Midway Pass', alt: midAlt + 140, lat: shortestWaypoints[1][0], lng: shortestWaypoints[1][1] });
      }

      shortestWaypoints.push([this.destCity.lat, this.destCity.lng]);
      ecoWaypoints.push([this.destCity.lat, this.destCity.lng]);

      this.currentCorridor = {
        id: 'custom',
        name: `${this.originCity.name} ➔ ${this.destCity.name}`,
        origin: this.originCity,
        destination: this.destCity,
        distanceKm: dist,
        elevationData: {
          shortestRoute: {
            name: 'Direct NH Mountain Highway (Shortest)',
            distanceKm: dist,
            totalClimbMeters: Math.round(Math.abs(this.destCity.alt - this.originCity.alt) * 1.8 + 450),
            maxGrade: 6.5,
            avgGrade: 2.2,
            waypoints: shortestWaypoints,
            intermediateCities: intermediateCitiesList,
            points: window.generateElevationProfile(dist, this.originCity.alt, this.destCity.alt, profileWaypointsShortest)
          },
          ecoRoute: {
            name: 'Valley Contour Eco Bypass',
            distanceKm: Math.round(dist * 1.05),
            totalClimbMeters: Math.round(Math.abs(this.destCity.alt - this.originCity.alt) * 0.9 + 180),
            maxGrade: 2.5,
            avgGrade: 0.8,
            waypoints: ecoWaypoints,
            intermediateCities: intermediateCitiesList,
            points: window.generateElevationProfile(Math.round(dist * 1.05), this.originCity.alt, this.destCity.alt, profileWaypointsEco)
          }
        }
      };
    }

    this.recalculateAll();
    this.updateMapRoutes();
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

  offsetPolylineCoords(coords, offsetDeg = 0.028) {
    if (!coords || coords.length < 2) return coords;
    const n = coords.length;
    return coords.map((c, i) => {
      let prev = coords[Math.max(0, i - 1)];
      let next = coords[Math.min(n - 1, i + 1)];
      let dLat = next[0] - prev[0];
      let dLng = next[1] - prev[1];
      let len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.0001;

      // Parabolic arc multiplier: 0 at origin pin, peak arc at mid-route, 0 at destination pin
      const progress = i / (n - 1);
      const arc = Math.sin(progress * Math.PI);
      const curOffset = offsetDeg * arc;

      let offLat = (-dLng / len) * curOffset;
      let offLng = (dLat / len) * curOffset;
      return [c[0] + offLat, c[1] + offLng];
    });
  }

  async updateMapRoutes() {
    if (!this.map) return;
    const origin = this.originCity;
    const destination = this.destCity;
    const elevationData = this.currentCorridor.elevationData;
    const roadPref = document.getElementById('roadRoutePreference') ? document.getElementById('roadRoutePreference').value : 'eco';

    // Immediately clear segment highlights & popups and reset map view to full corridor
    this.clearSegmentHighlight();
    const initialBounds = L.latLngBounds([
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    ]);
    try {
      this.map.fitBounds(initialBounds, { padding: [50, 50], animate: false });
    } catch (e) {}

    if (this.originMarker) this.map.removeLayer(this.originMarker);
    if (this.destMarker) this.map.removeLayer(this.destMarker);
    if (this.shortestPolyline) this.map.removeLayer(this.shortestPolyline);
    if (this.ecoPolyline) this.map.removeLayer(this.ecoPolyline);
    this.cityMarkers.forEach(m => this.map.removeLayer(m));
    this.cityMarkers = [];

    const originIcon = L.divIcon({
      className: 'custom-pin origin-pin-icon',
      html: `<div style="background: #059669; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px rgba(5, 150, 105, 0.7);"></div>`,
      iconSize: [18, 18]
    });

    const destIcon = L.divIcon({
      className: 'custom-pin dest-pin-icon',
      html: `<div style="background: #e11d48; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 12px rgba(225, 29, 72, 0.7);"></div>`,
      iconSize: [18, 18]
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

    const fetchedShortest = await this.fetchOsrmRoute(shortestInput) || shortestInput;
    const fetchedEco = await this.fetchOsrmRoute(ecoInput) || ecoInput;

    this.realShortestCoords = fetchedShortest;
    this.realEcoCoords = fetchedEco;

    // Dynamically snap real cities in database to the exact displayed road path coordinates
    const shortestMatched = window.findCitiesAlongRoadPath(fetchedShortest, this.cities, origin.id, destination.id, 35);
    const ecoMatched = window.findCitiesAlongRoadPath(fetchedEco, this.cities, origin.id, destination.id, 35);

    if (shortestMatched.length > 0) {
      elevationData.shortestRoute.intermediateCities = shortestMatched.map(m => ({ name: m.cleanName, alt: m.alt, lat: m.lat, lng: m.lng }));
    }
    if (ecoMatched.length > 0) {
      elevationData.ecoRoute.intermediateCities = ecoMatched.map(m => ({ name: m.cleanName, alt: m.alt, lat: m.lat, lng: m.lng }));
    }

    // Re-generate elevation profile points using actual distances & elevations of matched road cities
    const shortestWaypointsForProfile = shortestMatched.map(m => ({
      pos: Math.min(0.95, Math.max(0.05, m.distanceAlongRoadKm / (elevationData.shortestRoute.distanceKm || 100))),
      alt: m.alt,
      city: `${m.cleanName} (${m.alt}m)`
    }));

    const ecoWaypointsForProfile = ecoMatched.map(m => ({
      pos: Math.min(0.95, Math.max(0.05, m.distanceAlongRoadKm / (elevationData.ecoRoute.distanceKm || 100))),
      alt: m.alt,
      city: `${m.cleanName} (${m.alt}m)`
    }));

    if (shortestWaypointsForProfile.length > 0) {
      elevationData.shortestRoute.points = window.generateElevationProfile(
        elevationData.shortestRoute.distanceKm, origin.alt, destination.alt, shortestWaypointsForProfile
      );
    }
    if (ecoWaypointsForProfile.length > 0) {
      elevationData.ecoRoute.points = window.generateElevationProfile(
        elevationData.ecoRoute.distanceKm, origin.alt, destination.alt, ecoWaypointsForProfile
      );
    }

    // Draw Shortest Highway (Red) on direct road path and Eco-Incline Route (Green) along parallel low-elevation contour arc
    const renderShortestCoords = fetchedShortest;
    const renderEcoCoords = this.offsetPolylineCoords(fetchedEco, -0.008);

    // Draw Shortest Highway Polyline (RED)
    this.shortestPolyline = L.polyline(renderShortestCoords, {
      color: '#e11d48',
      weight: (roadPref === 'shortest') ? 6 : 4,
      dashArray: '8, 6',
      opacity: (roadPref === 'shortest') ? 1.0 : 0.85
    }).addTo(this.map).bindPopup(`<b>🔴 Red Line: Shortest Highway</b><br>Direct highway path with mountain gradient cuts.`);

    // Draw Eco-Incline Polyline (GREEN)
    this.ecoPolyline = L.polyline(renderEcoCoords, {
      color: '#059669',
      weight: (roadPref === 'eco') ? 6 : 4,
      opacity: (roadPref === 'eco') ? 1.0 : 0.85
    }).addTo(this.map).bindPopup(`<b>🟢 Green Line: Eco-Incline Route</b><br>Optimized bypass expressway with minimal vertical climb.`);

    // Bring active strategy route to front so it stays on top, while inactive is still clearly visible below!
    if (roadPref === 'shortest') {
      this.shortestPolyline.bringToFront();
    } else {
      this.ecoPolyline.bringToFront();
    }

    // Make map overlay legend items interactive to highlight routes on click
    const legendEl = document.querySelector('.map-overlay-legend');
    if (legendEl) {
      legendEl.style.cursor = 'pointer';
      legendEl.onclick = (e) => {
        const item = e.target.closest('.legend-item');
        if (!item) return;
        const text = item.textContent || '';
        const roadPrefSelect = document.getElementById('roadRoutePreference');
        if (text.includes('Shortest')) {
          if (roadPrefSelect) roadPrefSelect.value = 'shortest';
        } else if (text.includes('Eco')) {
          if (roadPrefSelect) roadPrefSelect.value = 'eco';
        }
        this.updateMapRoutes();
        this.recalculateAll();
      };
    }

    const activeRouteObj = (roadPref === 'eco') ? elevationData.ecoRoute : elevationData.shortestRoute;
    if (activeRouteObj.intermediateCities) {
      activeRouteObj.intermediateCities.forEach(city => {
        if (city.lat && city.lng) {
          const pinColor = (roadPref === 'eco') ? '#059669' : '#e11d48';
          const cityIcon = L.divIcon({
            className: 'custom-pin city-pin-icon',
            html: `<div style="background: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #fff; box-shadow: 0 0 10px ${pinColor};"></div>`,
            iconSize: [14, 14]
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

    this.recalculateAll();
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

  assignAllCitiesToProfilePoints(elevationData, waypointsList) {
    if (!waypointsList || waypointsList.length === 0) return;

    ['shortestRoute', 'ecoRoute'].forEach(routeKey => {
      const route = elevationData[routeKey];
      if (!route || !route.points || route.points.length === 0) return;

      const pts = route.points;
      const totalKm = route.distanceKm || pts[pts.length - 1].distanceKm;

      pts.forEach(p => p.city = null);

      const n = waypointsList.length;
      waypointsList.forEach((cityName, idx) => {
        const targetKm = (idx / Math.max(1, n - 1)) * totalKm;

        let closestPt = pts[0];
        let minDiff = Math.abs(pts[0].distanceKm - targetKm);

        pts.forEach(p => {
          const diff = Math.abs(p.distanceKm - targetKm);
          if (diff < minDiff) {
            minDiff = diff;
            closestPt = p;
          }
        });

        closestPt.city = cityName;
      });
    });
  }

  renderIntermediateCitiesStrip() {
    const strip = document.getElementById('intermediateCitiesStrip');
    if (!strip) return;

    const roadPref = document.getElementById('roadRoutePreference') ? document.getElementById('roadRoutePreference').value : 'eco';
    const activeRouteObj = (roadPref === 'eco') 
      ? this.currentCorridor.elevationData.ecoRoute 
      : this.currentCorridor.elevationData.shortestRoute;

    const routeTag = (roadPref === 'eco') ? '🟢 Eco Bypass' : '🔴 Shortest Highway';

    const pts = activeRouteObj.points || [];
    const cityPoints = pts.filter(p => p.city);

    if (cityPoints.length === 0) return;

    const cityBadgesHtml = cityPoints.map(p => {
      const isHighTraffic = (p.altitudeMeters > 350 || p.city.includes('Pass') || p.city.includes('Summit') || p.city.includes('Ghat'));
      const trafficDot = isHighTraffic ? '🔴 High Traffic' : '🟢 Low Traffic';
      return `<span class="city-badge" style="font-size: 0.78rem; border: 1px solid var(--border-subtle); background: var(--bg-card);"><i class="fa-solid fa-location-dot" style="color:${roadPref==='eco'?'#059669':'#e11d48'};"></i> <strong>${p.city}</strong> (${p.altitudeMeters}m) · <small>${trafficDot}</small></span>`;
    }).join(' ');

    strip.innerHTML = `<strong><i class="fa-solid fa-city"></i> ${routeTag} Corridor Cities (${cityPoints.length}):</strong> ${cityBadgesHtml}`;
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

    if (ecoComparison.segmentedBreakdown && ecoComparison.segmentedBreakdown.waypointsList) {
      this.assignAllCitiesToProfilePoints(elevationData, ecoComparison.segmentedBreakdown.waypointsList);
    }

    this.updateElevationChart(elevationData);
    this.renderIntermediateCitiesStrip();

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
    const tollSaved = ecoComparison.recommendation.tollSavedINR || 0;

    document.getElementById('kpiEcoSavings').innerText = `${savedFuel} L + \u20b9${tollSaved.toLocaleString('en-IN')} tolls`;
    document.getElementById('kpiEcoSavingsSub').innerText = `Total ₹${savedMoneyINR.toLocaleString('en-IN')} saved (fuel + tolls)`;
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
    const sToll = s.tollINR || 0;
    const eToll = e.tollINR || 0;
    const sTotalCost = sFuelCost + sToll + 12000;
    const eTotalCost = eFuelCost + eToll + 12000;
    const totalSaving = Math.max(0, sTotalCost - eTotalCost);

    const sKml = s.analysis.cmvrGhatMileageKml || s.analysis.cmvrPlainsMileageKml || 3.2;
    const eKml = (parseFloat(document.getElementById('vehicleMileage').value) || 3.2) * 1.18;

    const thead = document.querySelector('#ecoTableBody')?.closest('table')?.querySelector('thead tr');
    if (thead && thead.children.length < 9) {
      thead.innerHTML = `
        <th>Route Option</th>
        <th>Distance (km)</th>
        <th>Total Climb (m)</th>
        <th>Max Grade</th>
        <th>CMVR Mileage (km/L)</th>
        <th>Est. Diesel (L)</th>
        <th>Fuel Cost (₹)</th>
        <th>Toll Cost (₹)</th>
        <th>Total Freight Cost (₹)</th>
      `;
    }

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
        <td>₹${sToll.toLocaleString('en-IN')}</td>
        <td>₹${sTotalCost.toLocaleString('en-IN')}</td>
      </tr>
      <tr style="background: rgba(5, 150, 105, 0.08);">
        <td><strong style="color: #059669;">Eco-Incline Bypass (Gentle Contour) ⭐</strong></td>
        <td>${e.distanceKm} km</td>
        <td><strong style="color: #059669;">${e.analysis.totalClimbMeters} m</strong></td>
        <td>${e.analysis.maxGrade}%</td>
        <td><strong style="color: #059669;">${eKml.toFixed(2)} km/L (Optimized)</strong></td>
        <td><strong style="color: #059669;">${e.totalFuelLiters} L</strong></td>
        <td><strong style="color: #059669;">₹${eFuelCost.toLocaleString('en-IN')}</strong></td>
        <td><strong style="color: #059669;">₹${eToll.toLocaleString('en-IN')}</strong></td>
        <td><strong style="color: #059669;">₹${eTotalCost.toLocaleString('en-IN')}</strong></td>
      </tr>
      <tr style="background: rgba(37,99,235,0.06); border-top: 2px solid rgba(37,99,235,0.25);">
        <td colspan="6"><strong style="color:#2563eb;">&#127381; Net Savings (Eco vs Shortest)</strong></td>
        <td><strong style="color:#16a34a;">₹${Math.max(0,sFuelCost-eFuelCost).toLocaleString('en-IN')}</strong></td>
        <td><strong style="color:#16a34a;">₹${Math.max(0,sToll-eToll).toLocaleString('en-IN')}</strong></td>
        <td><strong style="color:#16a34a; font-size:1rem;">₹${totalSaving.toLocaleString('en-IN')}</strong></td>
      </tr>
    `;

    this.renderSegmentedTable(ecoComparison);
  }

  highlightSegmentOnMapAndChart(leg, rowIndex) {
    const tbody = document.getElementById('segmentTableBody');
    if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(r => r.classList.remove('segment-row-selected'));
      if (rows[rowIndex]) {
        rows[rowIndex].classList.add('segment-row-selected');
      }
    }

    this.selectedSegment = leg;
    if (this.elevationChart) {
      this.elevationChart.update();
    }

    if (!this.map) return;

    if (this.segmentHighlightLayer) {
      this.map.removeLayer(this.segmentHighlightLayer);
      this.segmentHighlightLayer = null;
    }

    const roadPref = document.getElementById('roadRoutePreference') ? document.getElementById('roadRoutePreference').value : 'eco';
    const coords = (roadPref === 'eco' && this.realEcoCoords) ? this.realEcoCoords : (this.realShortestCoords || []);

    if (!coords || coords.length === 0) return;

    const totalKm = leg.totalRouteDistanceKm || (this.currentCorridor ? this.currentCorridor.distanceKm : 600);
    const startRatio = leg.segStartKm / totalKm;
    const endRatio = leg.segEndKm / totalKm;

    const startIdx = Math.floor(startRatio * (coords.length - 1));
    const endIdx = Math.min(coords.length - 1, Math.ceil(endRatio * (coords.length - 1)));

    const segCoords = coords.slice(Math.max(0, startIdx), Math.min(coords.length, endIdx + 1));
    if (segCoords.length < 2) return;

    const group = L.featureGroup();

    const glowLine = L.polyline(segCoords, {
      color: '#3b82f6',
      weight: 14,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    });

    const mainLine = L.polyline(segCoords, {
      color: '#1d4ed8',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    });

    group.addLayer(glowLine);
    group.addLayer(mainLine);

    const startCoord = segCoords[0];
    const endCoord = segCoords[segCoords.length - 1];

    const startPin = L.divIcon({
      className: 'segment-stretch-pin',
      html: `<div style="background: #2563eb; color: #fff; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); white-space: nowrap;">📍 Start: ${leg.fromName}</div>`,
      iconSize: [100, 24]
    });

    const endPin = L.divIcon({
      className: 'segment-stretch-pin',
      html: `<div style="background: #059669; color: #fff; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); white-space: nowrap;">🏁 End: ${leg.toName}</div>`,
      iconSize: [100, 24]
    });

    const m1 = L.marker(startCoord, { icon: startPin });
    const m2 = L.marker(endCoord, { icon: endPin });

    group.addLayer(m1);
    group.addLayer(m2);

    group.addTo(this.map);
    this.segmentHighlightLayer = group;

    const midIdx = Math.floor(segCoords.length / 2);
    const midCoord = segCoords[midIdx] || startCoord;
    this.segmentPopup = L.popup({ autoClose: true, closeOnClick: true })
      .setLatLng(midCoord)
      .setContent(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <strong style="color: #1d4ed8; font-size: 0.92rem;">📍 Leg #${leg.legNumber}: ${leg.legName}</strong><br>
          <span style="font-size: 0.82rem; color: #475569;">
            <b>Distance:</b> ${leg.distanceKm} km | <b>Avg Elevation:</b> ${leg.avgElevationMeters} m<br>
            <b>Traffic Status:</b> <span style="color: ${leg.trafficStatus === 'HIGH' ? '#e11d48' : '#059669'}; font-weight:700;">${leg.trafficStatus} (${leg.trafficReason})</span>
          </span>
        </div>
      `)
      .openOn(this.map);

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true });
    }
  }

  renderSegmentedTable(ecoComparison) {
    const segData = ecoComparison.segmentedBreakdown;
    if (!segData || !segData.segmentedLegs) return;

    const totalFuelSaved = segData.totalSegSavingsLiters;
    const totalFuelINR = segData.totalSegFuelSavingsINR || 0;
    const totalTollINR = segData.totalSegTollSavingsINR || 0;
    const totalSaved = segData.totalSegSavingsINR;

    const kpiContainer = document.getElementById('segmentKpiPills');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <span class="segment-pill"><i class="fa-solid fa-layer-group"></i> <strong>${segData.numSegments}</strong> Town Legs</span>
        <span class="segment-pill traffic-pill-high"><i class="fa-solid fa-triangle-exclamation"></i> <strong>${segData.highTrafficCount}</strong> High Traffic</span>
        <span class="segment-pill traffic-pill-low"><i class="fa-solid fa-circle-check"></i> <strong>${segData.lowTrafficCount}</strong> Low Traffic</span>
        <span class="segment-pill segment-pill-savings"><i class="fa-solid fa-gas-pump"></i> Fuel Saved: <strong>${totalFuelSaved} L</strong> (₹${totalFuelINR.toLocaleString('en-IN')})</span>
        <span class="segment-pill segment-pill-toll"><i class="fa-solid fa-road-barrier"></i> Toll Saved: <strong>₹${totalTollINR.toLocaleString('en-IN')}</strong></span>
        <span class="segment-pill segment-pill-total-savings"><i class="fa-solid fa-piggy-bank"></i> Total Savings: <strong>₹${totalSaved.toLocaleString('en-IN')}</strong></span>
      `;
    }

    const tbody = document.getElementById('segmentTableBody');
    if (!tbody) return;

    tbody.innerHTML = segData.segmentedLegs.map(leg => {
      const trafficBadgeClass = leg.trafficStatus === 'HIGH' ? 'traffic-badge-high' : 'traffic-badge-low';
      const trafficIcon = leg.trafficStatus === 'HIGH' ? 'fa-triangle-exclamation' : 'fa-circle-check';
      const hasSavings = leg.segFuelSavingsLiters > 0 || leg.segTollSavingsINR > 0;

      return `
        <tr title="Click to highlight #${leg.legNumber} ${leg.legName} stretch on map & elevation graph">
          <td><strong>#${leg.legNumber}</strong></td>
          <td><strong>${leg.legName}</strong> <i class="fa-solid fa-arrow-pointer" style="font-size: 0.72rem; color: #3b82f6; margin-left: 4px;" title="Click to highlight stretch on map"></i></td>
          <td>${leg.distanceKm} km</td>
          <td><strong>${leg.avgElevationMeters} m</strong></td>
          <td><span class="traffic-badge ${trafficBadgeClass}"><i class="fa-solid ${trafficIcon}"></i> ${leg.trafficStatus} (${leg.trafficReason})</span></td>
          <td><i class="fa-solid fa-clock"></i> ${leg.fastestTimeHours}h | <i class="fa-solid fa-gas-pump"></i> ${leg.fastestFuelLiters} L</td>
          <td><strong style="color: #059669;"><i class="fa-solid fa-clock"></i> ${leg.ecoTimeHours}h | <i class="fa-solid fa-gas-pump"></i> ${leg.ecoFuelLiters} L</strong></td>
          <td>${hasSavings ? `<strong style="color:#16a34a;">+${leg.segFuelSavingsLiters} L (₹${(leg.segFuelSavingsINR||0).toLocaleString('en-IN')})</strong>` : `<span style="color:var(--text-muted);">0 L (₹0)</span>`}</td>
          <td>${leg.segTollSavingsINR > 0 ? `<strong style="color:#2563eb;">₹${leg.segTollSavingsINR.toLocaleString('en-IN')}</strong>` : `<span style="color:var(--text-muted);">-</span>`}</td>
          <td><strong style="color:#059669; font-size:0.88rem;">₹${leg.segMoneySavingsINR.toLocaleString('en-IN')}</strong></td>
        </tr>
      `;
    }).join('');

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
      row.addEventListener('click', () => {
        const leg = segData.segmentedLegs[idx];
        if (leg) {
          this.highlightSegmentOnMapAndChart(leg, idx);
        }
      });
    });
  }
}

window.app = new TransportPlannerApp();
