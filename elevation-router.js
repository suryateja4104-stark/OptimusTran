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
   * Analyze an elevation profile array
   */
  analyzeProfile(profilePoints, payloadTons = 18) {
    if (!profilePoints || profilePoints.length < 2) {
      return {
        totalClimbMeters: 0,
        maxGrade: 0,
        avgGrade: 0,
        extraFuelLiters: 0,
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
    const totalMassKg = (this.tareWeightTons + payloadTons) * 1000;
    const potentialEnergyJoules = totalMassKg * this.gravityAcc * totalClimb;
    const potentialEnergyMJ = potentialEnergyJoules / 1000000;
    
    const fuelLitersForClimb = potentialEnergyMJ / (this.fuelEnergyPerLiter * this.truckEfficiency);

    return {
      totalClimbMeters: Math.round(totalClimb),
      maxGrade,
      avgGrade,
      steepClimbsCount: steepCount,
      extraFuelLiters: Math.round(fuelLitersForClimb * 10) / 10,
      segments
    };
  }

  /**
   * Compare Shortest Route vs. Eco-Incline Route
   */
  compareRoutes(shortestProfile, ecoProfile, payloadTons = 18, mileageKml = 3.2, dieselPriceINR = 94.50) {
    const shortestAnalysis = this.analyzeProfile(shortestProfile.points, payloadTons);
    const ecoAnalysis = this.analyzeProfile(ecoProfile.points, payloadTons);

    const shortestDistFuel = shortestProfile.distanceKm / mileageKml;
    const ecoDistFuel = ecoProfile.distanceKm / mileageKml;

    const totalShortestFuel = shortestDistFuel + shortestAnalysis.extraFuelLiters;
    const totalEcoFuel = ecoDistFuel + ecoAnalysis.extraFuelLiters;

    const netFuelSavedLiters = Math.round((totalShortestFuel - totalEcoFuel) * 10) / 10;
    const netMoneySavedINR = Math.round(netFuelSavedLiters * dieselPriceINR);
    const totalClimbSavedMeters = shortestAnalysis.totalClimbMeters - ecoAnalysis.totalClimbMeters;

    const isEcoRouteSuperior = netFuelSavedLiters > 0;

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
      recommendation: {
        isEcoRouteSuperior,
        netFuelSavedLiters: Math.max(0, netFuelSavedLiters),
        netMoneySavedINR: Math.max(0, netMoneySavedINR),
        totalClimbSavedMeters: Math.max(0, totalClimbSavedMeters),
        co2SavedKg: Math.round(Math.max(0, netFuelSavedLiters) * 2.68),
        summaryText: isEcoRouteSuperior 
          ? `Taking the Eco-Incline Bypass reduces steep vertical climbs by ${totalClimbSavedMeters}m, saving ${netFuelSavedLiters} Liters of diesel (₹${netMoneySavedINR.toLocaleString()} savings) compared to the shortest mountain highway.`
          : `The Shortest Highway is already incline-optimal for this corridor.`
      }
    };
  }
}

window.ElevationRouter = ElevationRouter;
