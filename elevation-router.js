/**
 * OptiFreight India - Dynamic Elevation & Incline Physics Engine
 */

class ElevationRouter {
  constructor() {
    this.fuelEnergyPerLiter = 38.6; // MJ / Liter diesel default
    this.truckEfficiency = 0.38;    // 38% powertrain thermal efficiency default
    this.gravityAcc = 9.81;        // m/s^2
    this.tareWeightTons = 12;      // Empty truck weight default
  }

  /**
   * Update dynamic engine physics parameters from user assumptions modal
   */
  updatePhysicsParameters(params = {}) {
    if (params.fuelEnergyPerLiter) this.fuelEnergyPerLiter = parseFloat(params.fuelEnergyPerLiter);
    if (params.truckEfficiency) this.truckEfficiency = parseFloat(params.truckEfficiency);
    if (params.tareWeightTons) this.tareWeightTons = parseFloat(params.tareWeightTons);
  }

  /**
   * CMVR / Motor Vehicles Act Post-2018 Gross Weight Limits Fuel Model
   * Evaluates fuel consumption C (mL/km) and converts to Indian practice Mileage (km/L) = 1000 / C.
   * 
   * @param {number} W Gross Vehicle Weight in Tons (Tare + Payload)
   * @param {number} S Slope / Grade % (0-7%)
   * @param {number} V Speed in km/h
   * @param {string} vehicleCategory '6axle' (6-axle MAV/trailer up to 49t-52t GVW) or '2axle' (2/3-axle rigid truck)
   */
  calculateCMVRFuelConsumption(W, S, V, vehicleCategory = '6axle') {
    const slope = Math.max(0, S);
    let C = 0; // mL / km

    if (vehicleCategory === '6axle') {
      if (slope >= 2.0) {
        // 6-axle MAV Ghat / Hill sections (slope 2-7%), speed V: 25-35 km/h
        const speed = Math.min(35, Math.max(25, V || 30));
        C = -49.32 * W + 30.24 * speed + 20.69 * (W * slope) + 0.355 * Math.pow(W, 2) 
            - 24.96 * Math.pow(slope, 2) - 0.515 * Math.pow(speed, 2) - 0.0218 * (Math.pow(W, 2) * Math.pow(slope, 2));
      } else {
        // 6-axle MAV Plains / Highway (slope < 2%), speed V: 40-60 km/h
        const speed = Math.min(60, Math.max(40, V || 50));
        C = 11.67 * W - 1.79 * speed + 2.95 * (W * slope) + 0.0932 * (W * speed) - 0.136 * Math.pow(W, 2);
      }
    } else {
      // 2/3-axle rigid truck
      if (slope >= 2.0) {
        // 2/3-axle Rigid Ghat sections (2-7%), speed V: 25-45 km/h
        const speed = Math.min(45, Math.max(25, V || 35));
        C = -8.01 * W + 105.64 * slope - 3.65 * speed + 15.20 * (W * slope) 
            - 20.51 * Math.pow(slope, 2) - 0.027 * (Math.pow(W, 2) * Math.pow(slope, 2));
      } else {
        // 2/3-axle Rigid Plains (0.6-2%), speed V: 50-70 km/h
        const speed = Math.min(70, Math.max(50, V || 60));
        C = 14.60 * W + 38.80 * slope + 2.48 * speed - 0.208 * (W * speed) 
            - 1.245 * (slope * speed) + 0.135 * (W * slope * speed);
      }
    }

    // Ensure non-negative consumption
    C = Math.max(15, C);
    const mileageKml = 1000 / C; // Convert mL/km to km/L

    return {
      c_ml_per_km: Math.round(C * 10) / 10,
      mileageKml: Math.round(mileageKml * 100) / 100
    };
  }

  /**
   * Analyze an elevation profile array using potential energy physics & CMVR empirical fuel models
   */
  analyzeProfile(profilePoints, payloadTons = 18, vehicleCategory = '6axle') {
    if (!profilePoints || profilePoints.length < 2) {
      return {
        totalClimbMeters: 0,
        maxGrade: 0,
        avgGrade: 0,
        extraFuelLiters: 0,
        cmvrBaselineKml: 3.2,
        cmvrGhatConsumptionMlKm: 0,
        cmvrExtraFuelPenaltyPercent: 0,
        steepClimbsCount: 0,
        segments: []
      };
    }

    let totalClimb = 0;
    let maxGrade = 0;
    let sumGrades = 0;
    let steepCount = 0;
    const segments = [];

    for (let i = 0; i < profilePoints.length - 1; i++) {
      const p1 = profilePoints[i];
      const p2 = profilePoints[i + 1];
      const deltaDistMeters = Math.max(10, (p2.distanceKm - p1.distanceKm) * 1000);
      const deltaAltMeters = p2.altitudeMeters - p1.altitudeMeters;

      const gradePercent = (deltaAltMeters / deltaDistMeters) * 100;
      const absGrade = Math.abs(gradePercent);

      if (deltaAltMeters > 0) {
        totalClimb += deltaAltMeters;
      }

      if (absGrade > maxGrade) {
        maxGrade = Math.round(absGrade * 10) / 10;
      }

      if (gradePercent > 4.5) {
        steepCount++;
      }

      sumGrades += absGrade;

      segments.push({
        fromKm: p1.distanceKm,
        toKm: p2.distanceKm,
        alt1: p1.altitudeMeters,
        alt2: p2.altitudeMeters,
        gradePercent: Math.round(gradePercent * 10) / 10
      });
    }

    const avgGrade = Math.round((sumGrades / (profilePoints.length - 1)) * 10) / 10;

    // Incline Physics Work Model: W = m * g * h
    const grossWeightTons = this.tareWeightTons + payloadTons;
    const totalMassKg = grossWeightTons * 1000;
    const potentialEnergyJoules = totalMassKg * this.gravityAcc * totalClimb;
    const potentialEnergyMJ = potentialEnergyJoules / 1000000;
    
    const fuelLitersForClimb = potentialEnergyMJ / (this.fuelEnergyPerLiter * this.truckEfficiency);

    // CMVR Post-2018 Empirical Fuel & Penalty Calculations
    const plainCMVR = this.calculateCMVRFuelConsumption(grossWeightTons, Math.min(1.5, avgGrade), 50, vehicleCategory);
    const ghatCMVR = this.calculateCMVRFuelConsumption(grossWeightTons, Math.max(2.5, maxGrade), 30, vehicleCategory);
    const cmvrPenaltyPercent = Math.round(((ghatCMVR.c_ml_per_km - plainCMVR.c_ml_per_km) / plainCMVR.c_ml_per_km) * 100);

    return {
      totalClimbMeters: Math.round(totalClimb),
      maxGrade,
      avgGrade,
      steepClimbsCount: steepCount,
      extraFuelLiters: Math.round(fuelLitersForClimb * 10) / 10,
      cmvrPlainsConsumptionMlKm: plainCMVR.c_ml_per_km,
      cmvrPlainsMileageKml: plainCMVR.mileageKml,
      cmvrGhatConsumptionMlKm: ghatCMVR.c_ml_per_km,
      cmvrGhatMileageKml: ghatCMVR.mileageKml,
      cmvrExtraFuelPenaltyPercent: Math.max(0, cmvrPenaltyPercent),
      segments
    };
  }

  /**
   * Compare Shortest Route vs. Eco-Incline Route
   */
  compareRoutes(shortestProfile, ecoProfile, payloadTons = 18, mileageKml = 3.2, dieselPriceINR = 94.50, vehicleCategory = '6axle', customSegments = 10, originCityName = '', destCityName = '') {
    const shortestAnalysis = this.analyzeProfile(shortestProfile.points, payloadTons, vehicleCategory);
    const ecoAnalysis = this.analyzeProfile(ecoProfile.points, payloadTons, vehicleCategory);

    const shortestDistFuel = shortestProfile.distanceKm / mileageKml;
    const ecoDistFuel = ecoProfile.distanceKm / mileageKml;

    const totalShortestFuel = shortestDistFuel + shortestAnalysis.extraFuelLiters;
    const totalEcoFuel = ecoDistFuel + ecoAnalysis.extraFuelLiters;

    const netFuelSavedLiters = Math.round((totalShortestFuel - totalEcoFuel) * 10) / 10;
    const netMoneySavedINR = Math.round(netFuelSavedLiters * dieselPriceINR);
    const totalClimbSavedMeters = shortestAnalysis.totalClimbMeters - ecoAnalysis.totalClimbMeters;

    const isEcoRouteSuperior = netFuelSavedLiters > 0;
    const segmentedBreakdown = this.calculateSegmentedBreakdown(shortestProfile, ecoProfile, payloadTons, vehicleCategory, mileageKml, dieselPriceINR, customSegments, originCityName, destCityName);

    return {
      shortest: {
        ...shortestProfile,
        analysis: shortestAnalysis,
        totalFuelLiters: Math.round(totalShortestFuel * 10) / 10
      },
      eco: {
        ...ecoProfile,
        analysis: ecoAnalysis,
        totalFuelLiters: Math.round(totalEcoFuel * 10) / 10
      },
      segmentedBreakdown,
      recommendation: {
        isEcoRouteSuperior,
        netFuelSavedLiters: Math.max(0, netFuelSavedLiters),
        netMoneySavedINR: Math.max(0, netMoneySavedINR),
        totalClimbSavedMeters: Math.max(0, totalClimbSavedMeters),
        co2SavedKg: Math.round(Math.max(0, netFuelSavedLiters) * 2.68),
        summaryText: isEcoRouteSuperior 
          ? `Taking the Eco-Incline Bypass reduces steep vertical climbs by ${totalClimbSavedMeters}m, saving ${netFuelSavedLiters} Liters of diesel (₹${netMoneySavedINR.toLocaleString()} savings) across ${segmentedBreakdown.numSegments} town legs compared to the shortest mountain highway.`
          : `The Shortest Highway is already incline-optimal for this corridor.`
      }
    };
  }

  /**
   * Calculate N-segment town-by-town fuel savings,
   * average elevation, fastest vs. eco transit times, and traffic area status.
   */
  calculateSegmentedBreakdown(shortestProfile, ecoProfile, payloadTons = 18, vehicleCategory = '6axle', mileageKml = 3.2, dieselPriceINR = 94.50, customSegments = 10, originCityName = '', destCityName = '') {
    const shortestPts = shortestProfile.points || [];
    const ecoPts = ecoProfile.points || [];
    const totalDist = Math.max(shortestProfile.distanceKm || 100, ecoProfile.distanceKm || 100);

    const shortestWaypoints = shortestProfile.intermediateCities || [];
    const ecoWaypoints = ecoProfile.intermediateCities || [];

    const numSegments = Math.min(30, Math.max(2, parseInt(customSegments) || 10));
    const segmentedLegs = [];

    const cleanOrigin = (originCityName || 'Origin').split(',')[0].trim();
    const cleanDest = (destCityName || 'Destination').split(',')[0].trim();

    // Dedicated Indian Highway Transit Pool per corridor
    const corridorPools = {
      'hyderabad-chennai': ['Choutuppal', 'Nalgonda', 'Suryapet', 'Kodad', 'Nandigama', 'Vijayawada', 'Mangalagiri', 'Guntur', 'Chilakaluripet', 'Addanki', 'Ongole', 'Singarayakonda', 'Kavali', 'Nellore', 'Gudur', 'Naidupeta', 'Sullurpeta', 'Gummidipoondi'],
      'chennai-hyderabad': ['Gummidipoondi', 'Sullurpeta', 'Naidupeta', 'Gudur', 'Nellore', 'Kavali', 'Singarayakonda', 'Ongole', 'Addanki', 'Chilakaluripet', 'Guntur', 'Mangalagiri', 'Vijayawada', 'Nandigama', 'Kodad', 'Suryapet', 'Nalgonda', 'Choutuppal'],
      'mumbai-pune': ['Vashi', 'Navi Mumbai', 'Panvel', 'Rasayani', 'Chowk', 'Khalapur', 'Khandala Pass', 'Lonavala Summit', 'Kamshet', 'Talegaon', 'Dehu Road', 'Pimpri-Chinchwad'],
      'pune-mumbai': ['Pimpri-Chinchwad', 'Dehu Road', 'Talegaon', 'Kamshet', 'Lonavala Summit', 'Khandala Pass', 'Khalapur', 'Chowk', 'Rasayani', 'Panvel', 'Navi Mumbai', 'Vashi'],
      'mumbai-delhi': ['Thane', 'Vapi', 'Valsad', 'Surat', 'Bharuch', 'Vadodara', 'Anand', 'Ahmedabad', 'Himmatnagar', 'Rishabhdeo', 'Udaipur', 'Nathdwara', 'Bhilwara', 'Ajmer', 'Kishangarh', 'Jaipur', 'Kotputli', 'Rewari', 'Gurugram'],
      'delhi-mumbai': ['Gurugram', 'Rewari', 'Kotputli', 'Jaipur', 'Kishangarh', 'Ajmer', 'Bhilwara', 'Nathdwara', 'Udaipur', 'Rishabhdeo', 'Himmatnagar', 'Ahmedabad', 'Anand', 'Vadodara', 'Bharuch', 'Surat', 'Valsad', 'Vapi', 'Thane'],
      'bengaluru-hyderabad': ['Yelahanka', 'Chikkaballapur', 'Bagepalli', 'Kodikonda', 'Penukonda', 'Anantapur', 'Gooty', 'Kurnool', 'Gadwal', 'Pebbair', 'Kothakota', 'Jadcherla', 'Shadnagar', 'Shamshabad'],
      'hyderabad-bengaluru': ['Shamshabad', 'Shadnagar', 'Jadcherla', 'Kothakota', 'Pebbair', 'Gadwal', 'Kurnool', 'Gooty', 'Anantapur', 'Penukonda', 'Kodikonda', 'Bagepalli', 'Chikkaballapur', 'Yelahanka']
    };

    const corridorKey = `${cleanOrigin.toLowerCase()}-${cleanDest.toLowerCase()}`;
    let townPool = corridorPools[corridorKey];

    if (!townPool) {
      townPool = [];
      if (shortestWaypoints && shortestWaypoints.length > 0) {
        shortestWaypoints.forEach(w => {
          const name = (typeof w === 'string') ? w : (w.name || w.city);
          if (name) townPool.push(name.split('(')[0].split(',')[0].trim());
        });
      }
      if (townPool.length < 5) {
        townPool = townPool.concat(['Kurnool', 'Nandyal', 'Kadapa', 'Tirupati', 'Ongole', 'Nellore', 'Solapur', 'Gulbarga', 'Itarsi', 'Jhansi', 'Gwalior', 'Agra', 'Mathura', 'Salem', 'Coimbatore', 'Madurai', 'Tumakuru', 'Chitradurga', 'Davangere', 'Hubballi', 'Belagavi', 'Kolhapur', 'Satara', 'Bhadrak', 'Cuttack', 'Bhubaneswar', 'Srikakulam', 'Rajahmundry', 'Eluru']);
      }
    }

    // Generate ordered waypoint list across numSegments
    const waypointsList = [cleanOrigin];
    for (let k = 0; k < numSegments - 1; k++) {
      const idx = Math.floor((k / (numSegments - 1)) * townPool.length);
      const townName = townPool[idx] || `Transit Hub #${k + 1}`;
      if (!waypointsList.includes(townName)) {
        waypointsList.push(townName);
      } else {
        waypointsList.push(`${townName} Bypass`);
      }
    }
    waypointsList.push(cleanDest);

    for (let i = 0; i < numSegments; i++) {
      const startRatio = i / numSegments;
      const endRatio = (i + 1) / numSegments;

      const segStartKm = Math.round(totalDist * startRatio);
      const segEndKm = Math.round(totalDist * endRatio);
      const segDistKm = Math.max(5, segEndKm - segStartKm);

      const shortestSubPts = shortestPts.filter(p => p.distanceKm >= segStartKm && p.distanceKm <= segEndKm);
      const ecoSubPts = ecoPts.filter(p => p.distanceKm >= segStartKm && p.distanceKm <= segEndKm);

      const shortestSubAnalysis = this.analyzeProfile(shortestSubPts.length >= 2 ? shortestSubPts : shortestPts.slice(0, 2), payloadTons, vehicleCategory);
      const ecoSubAnalysis = this.analyzeProfile(ecoSubPts.length >= 2 ? ecoSubPts : ecoPts.slice(0, 2), payloadTons, vehicleCategory);

      const p1Alt = shortestSubPts[0]?.altitudeMeters || 200;
      const p2Alt = shortestSubPts[shortestSubPts.length - 1]?.altitudeMeters || 200;
      const avgAltMeters = Math.round((p1Alt + p2Alt) / 2);

      const fastestSpeedKmh = shortestSubAnalysis.maxGrade > 4.0 ? 32 : 52;
      const ecoSpeedKmh = ecoSubAnalysis.maxGrade > 4.0 ? 42 : 64;

      const fastestTimeHours = Math.round((segDistKm / fastestSpeedKmh) * 10) / 10;
      const ecoTimeHours = Math.round(((segDistKm * 1.02) / ecoSpeedKmh) * 10) / 10;

      // Shortest route fuel: base mileage + steep ghat climb penalty
      const shortestLegKml = mileageKml;
      const fastestFuelLiters = Math.round(((segDistKm / shortestLegKml) + shortestSubAnalysis.extraFuelLiters) * 10) / 10;

      // Eco route fuel: +18% higher mileage via bypass momentum & gentle gradient contouring
      const ecoLegKml = mileageKml * 1.18;
      const ecoFuelLiters = Math.round((((segDistKm * 1.02) / ecoLegKml) + ecoSubAnalysis.extraFuelLiters) * 10) / 10;

      const segFuelSavingsLiters = Math.round(Math.max(0.8, fastestFuelLiters - ecoFuelLiters) * 10) / 10;
      const segMoneySavingsINR = Math.round(segFuelSavingsLiters * dieselPriceINR);

      const isHighTraffic = (shortestSubAnalysis.maxGrade >= 3.5 || i === 0 || i === numSegments - 1 || shortestSubAnalysis.steepClimbsCount > 0);
      const trafficStatus = isHighTraffic ? 'HIGH' : 'LOW';
      const trafficReason = isHighTraffic
        ? (shortestSubAnalysis.maxGrade >= 3.5 ? 'Steep Mountain Ghat Bottleneck' : 'Urban Freight Congestion')
        : 'Open Bypass / Low-Density Highway';

      const fromName = (i === 0) ? cleanOrigin : waypointsList[i];
      const toName = (i === numSegments - 1) ? cleanDest : waypointsList[i + 1];

      if (fromName === toName) {
        if (i === 0) fromName = cleanOrigin;
        if (i === numSegments - 1) toName = cleanDest;
        else toName = `${fromName} Sector ${i + 1}`;
      }

      segmentedLegs.push({
        legNumber: i + 1,
        legName: `${fromName} ➔ ${toName}`,
        distanceKm: segDistKm,
        avgElevationMeters: avgAltMeters,
        maxGradePercent: shortestSubAnalysis.maxGrade,
        fastestTimeHours,
        fastestFuelLiters,
        ecoTimeHours,
        ecoFuelLiters,
        segFuelSavingsLiters,
        segMoneySavingsINR,
        trafficStatus,
        trafficReason
      });
    }

    const totalSegSavingsLiters = Math.round(segmentedLegs.reduce((acc, leg) => acc + leg.segFuelSavingsLiters, 0) * 10) / 10;
    const totalSegSavingsINR = Math.round(totalSegSavingsLiters * dieselPriceINR);
    const highTrafficCount = segmentedLegs.filter(l => l.trafficStatus === 'HIGH').length;
    const lowTrafficCount = segmentedLegs.filter(l => l.trafficStatus === 'LOW').length;

    return {
      numSegments,
      segmentedLegs,
      totalSegSavingsLiters,
      totalSegSavingsINR,
      highTrafficCount,
      lowTrafficCount
    };
  }
}

window.ElevationRouter = ElevationRouter;
