/**
 * OptiFreight India - Dynamic Multi-Modal Logistics & Rate Engine
 */

class TransportEngine {
  constructor() {
    this.vehicles = {
      'heavy_25t': {
        name: 'Heavy 12-Wheeler (25T)',
        maxPayloadTons: 25,
        defaultMileageKml: 3.2,
        baseRatePerKmINR: 42,
        weightRatePerTonKmINR: 0.85
      },
      'rigid_16t': {
        name: 'Standard 6-Wheeler (16T)',
        maxPayloadTons: 16,
        defaultMileageKml: 4.5,
        baseRatePerKmINR: 30,
        weightRatePerTonKmINR: 0.95
      },
      'trailer_40t': {
        name: 'Multi-Axle Container Trailer (40T)',
        maxPayloadTons: 40,
        defaultMileageKml: 2.2,
        baseRatePerKmINR: 65,
        weightRatePerTonKmINR: 0.75
      },
      'lcv_6t': {
        name: 'Medium LCV (6T)',
        maxPayloadTons: 6,
        defaultMileageKml: 7.0,
        baseRatePerKmINR: 20,
        weightRatePerTonKmINR: 1.15
      },
      'ev_heavy': {
        name: 'Electric Heavy Freight Truck',
        maxPayloadTons: 20,
        defaultMileageKml: 5.5,
        baseRatePerKmINR: 24,
        weightRatePerTonKmINR: 0.65
      }
    };

    // Rates & Benchmarks (User customizable)
    this.rates = {
      road: {
        volumetricRatio: 300,
        avgSpeedKmh: 52,
        co2GramsPerTonKm: 110,
        dieselPriceINR: 94.50
      },
      rail: {
        baseDrayageFeeINR: 4500,
        linehaulRatePerTonKmINR: 1.45,
        minChargeableTons: 10,
        avgSpeedKmh: 40,
        co2GramsPerTonKm: 28
      },
      air: {
        handlingFeeINR: 3500,
        ratePerChargeableKgPerKmINR: 0.048,
        volumetricRatio: 167,
        fixedGroundTimeHours: 5,
        avgSpeedKmh: 650,
        co2GramsPerTonKm: 520
      },
      seaways: {
        portHandlingFeeINR: 6800,
        linehaulRatePerTonKmINR: 0.42,
        fixedPortTimeHours: 14,
        avgSpeedKmh: 22,
        co2GramsPerTonKm: 14
      }
    };
  }

  /**
   * Update dynamic rate assumptions from user modal
   */
  updateAssumptions(customAssumptions = {}) {
    if (customAssumptions.railSidingFee) this.rates.rail.baseDrayageFeeINR = parseFloat(customAssumptions.railSidingFee);
    if (customAssumptions.railLinehaulRate) this.rates.rail.linehaulRatePerTonKmINR = parseFloat(customAssumptions.railLinehaulRate);

    if (customAssumptions.airHandlingFee) this.rates.air.handlingFeeINR = parseFloat(customAssumptions.airHandlingFee);
    if (customAssumptions.airLinehaulRate) this.rates.air.ratePerChargeableKgPerKmINR = parseFloat(customAssumptions.airLinehaulRate);

    if (customAssumptions.seaPortFee) this.rates.seaways.portHandlingFeeINR = parseFloat(customAssumptions.seaPortFee);
    if (customAssumptions.seaLinehaulRate) this.rates.seaways.linehaulRatePerTonKmINR = parseFloat(customAssumptions.seaLinehaulRate);
  }

  calculateCargoMetrics(payloadTons, lengthM, widthM, heightM) {
    const actualWeightKg = payloadTons * 1000;
    const volumeM3 = (lengthM && widthM && heightM) ? (lengthM * widthM * heightM) : 0;

    const airVolumetricKg = volumeM3 * this.rates.air.volumetricRatio;
    const roadVolumetricKg = volumeM3 * this.rates.road.volumetricRatio;

    const airChargeableKg = Math.max(actualWeightKg, airVolumetricKg);
    const roadChargeableKg = Math.max(actualWeightKg, roadVolumetricKg);
    const railChargeableTons = Math.max(payloadTons, this.rates.rail.minChargeableTons);
    const seaChargeableTons = Math.max(payloadTons, 15);

    return {
      actualWeightKg,
      actualWeightTons: payloadTons,
      volumeM3,
      airVolumetricKg: Math.round(airVolumetricKg),
      roadVolumetricKg: Math.round(roadVolumetricKg),
      airChargeableKg: Math.round(airChargeableKg),
      roadChargeableKg: Math.round(roadChargeableKg),
      railChargeableTons,
      seaChargeableTons,
      isDimensionalOverweight: (airVolumetricKg > actualWeightKg)
    };
  }

  evaluateAllModes(params) {
    const { 
      origin, 
      destination, 
      distanceKm, 
      payloadTons, 
      lengthM, 
      widthM, 
      heightM, 
      vehicleKey = 'heavy_25t',
      customMileageKml,
      dieselRateINR = 94.50,
      optimizationStrategy = 'balanced',
      roadElevationSummary 
    } = params;

    const cargo = this.calculateCargoMetrics(payloadTons, lengthM, widthM, heightM);
    const effectiveTons = cargo.actualWeightTons;

    const vehicleObj = this.vehicles[vehicleKey] || this.vehicles['heavy_25t'];
    const mileageKml = (customMileageKml && customMileageKml > 0) ? customMileageKml : vehicleObj.defaultMileageKml;

    // --- 1. ROAD LOGISTICS ---
    const baseFuelLiters = distanceKm / mileageKml;
    const baseFuelCostINR = baseFuelLiters * dieselRateINR;
    const distanceCostINR = (distanceKm * vehicleObj.baseRatePerKmINR) + 
                            (distanceKm * effectiveTons * vehicleObj.weightRatePerTonKmINR);
    
    let inclineFuelDeltaLiters = 0;
    let inclineCostDeltaINR = 0;
    let totalClimbMeters = 0;
    let roadSelectedDistance = distanceKm;
    let roadRouteName = "Standard Highway Corridor";

    if (roadElevationSummary) {
      inclineFuelDeltaLiters = roadElevationSummary.extraFuelLiters || 0;
      inclineCostDeltaINR = inclineFuelDeltaLiters * dieselRateINR;
      totalClimbMeters = roadElevationSummary.totalClimbMeters || 0;
      if (roadElevationSummary.selectedDistanceKm) roadSelectedDistance = roadElevationSummary.selectedDistanceKm;
      if (roadElevationSummary.routeName) roadRouteName = roadElevationSummary.routeName;
    }

    const totalRoadCostINR = Math.round(distanceCostINR + baseFuelCostINR + inclineCostDeltaINR);
    const roadTransitHours = Math.round((roadSelectedDistance / this.rates.road.avgSpeedKmh) * 10) / 10;
    const roadCO2Tons = Math.round((roadSelectedDistance * effectiveTons * this.rates.road.co2GramsPerTonKm / 1000000) * 100) / 100;

    // --- 2. RAILWAY FREIGHT ---
    let railLinehaul = roadSelectedDistance * cargo.railChargeableTons * this.rates.rail.linehaulRatePerTonKmINR;
    if (cargo.railChargeableTons > 25) {
      railLinehaul *= 0.88;
    }
    const totalRailCostINR = Math.round(this.rates.rail.baseDrayageFeeINR + railLinehaul);
    const railTransitHours = Math.round((roadSelectedDistance / this.rates.rail.avgSpeedKmh + 5) * 10) / 10;
    const railCO2Tons = Math.round((roadSelectedDistance * effectiveTons * this.rates.rail.co2GramsPerTonKm / 1000000) * 100) / 100;

    // --- 3. AIR FREIGHT ---
    const airLinehaul = roadSelectedDistance * cargo.airChargeableKg * this.rates.air.ratePerChargeableKgPerKmINR;
    const totalAirCostINR = Math.round(this.rates.air.handlingFeeINR + airLinehaul);
    const airTransitHours = Math.round((roadSelectedDistance / this.rates.air.avgSpeedKmh + this.rates.air.fixedGroundTimeHours) * 10) / 10;
    const airCO2Tons = Math.round((roadSelectedDistance * effectiveTons * this.rates.air.co2GramsPerTonKm / 1000000) * 100) / 100;

    // --- 4. SEAWAYS / COASTAL WATERWAYS ---
    const seaDistanceKm = Math.round(roadSelectedDistance * 1.12);
    const seaLinehaul = seaDistanceKm * cargo.seaChargeableTons * this.rates.seaways.linehaulRatePerTonKmINR;
    const totalSeaCostINR = Math.round(this.rates.seaways.portHandlingFeeINR + seaLinehaul);
    const seaTransitHours = Math.round((seaDistanceKm / this.rates.seaways.avgSpeedKmh + this.rates.seaways.fixedPortTimeHours) * 10) / 10;
    const seaCO2Tons = Math.round((seaDistanceKm * effectiveTons * this.rates.seaways.co2GramsPerTonKm / 1000000) * 100) / 100;

    const modes = [
      { id: 'road', name: 'Road Freight', costINR: totalRoadCostINR, timeHours: roadTransitHours, co2Tons: roadCO2Tons, icon: 'fa-truck' },
      { id: 'rail', name: 'Indian Rail Freight', costINR: totalRailCostINR, timeHours: railTransitHours, co2Tons: railCO2Tons, icon: 'fa-train' },
      { id: 'air', name: 'Air Cargo Express', costINR: totalAirCostINR, timeHours: airTransitHours, co2Tons: airCO2Tons, icon: 'fa-plane' },
      { id: 'seaways', name: 'Coastal Seaways (Sagarmala)', costINR: totalSeaCostINR, timeHours: seaTransitHours, co2Tons: seaCO2Tons, icon: 'fa-ship' }
    ];

    modes.forEach(m => {
      let score = 100;
      if (optimizationStrategy === 'cheapest') {
        score = 1000 - (m.costINR / 100);
      } else if (optimizationStrategy === 'fastest') {
        score = 1000 - (m.timeHours * 10);
      } else if (optimizationStrategy === 'eco') {
        score = 1000 - (m.co2Tons * 100);
      } else {
        score -= (m.costINR / Math.min(...modes.map(x => x.costINR))) * 45;
        score -= (m.timeHours / Math.min(...modes.map(x => x.timeHours))) * 25;
        score -= (m.co2Tons / Math.min(...modes.map(x => x.co2Tons))) * 15;
      }
      m.score = Math.round(score);
    });

    modes.sort((a, b) => b.score - a.score);
    const recommendedMode = modes[0];

    return {
      cargo,
      distanceKm: roadSelectedDistance,
      optimizationStrategy,
      vehicle: {
        key: vehicleKey,
        name: vehicleObj.name,
        mileageKml,
        dieselRateINR,
        baseFuelLiters: Math.round(baseFuelLiters * 10) / 10
      },
      road: {
        costINR: totalRoadCostINR,
        baseCostINR: Math.round(distanceCostINR),
        baseFuelCostINR: Math.round(baseFuelCostINR),
        inclineCostDeltaINR: Math.round(inclineCostDeltaINR),
        inclineFuelDeltaLiters: Math.round(inclineFuelDeltaLiters * 10) / 10,
        totalClimbMeters,
        routeName: roadRouteName,
        timeHours: roadTransitHours,
        co2Tons: roadCO2Tons
      },
      rail: {
        costINR: totalRailCostINR,
        timeHours: railTransitHours,
        co2Tons: railCO2Tons
      },
      air: {
        costINR: totalAirCostINR,
        timeHours: airTransitHours,
        co2Tons: airCO2Tons
      },
      seaways: {
        costINR: totalSeaCostINR,
        timeHours: seaTransitHours,
        co2Tons: seaCO2Tons
      },
      recommendedModeId: recommendedMode.id,
      recommendedModeName: recommendedMode.name,
      modes
    };
  }
}

window.TransportEngine = TransportEngine;
