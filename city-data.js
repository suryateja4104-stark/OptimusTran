/**
 * OptiFreight India - Indian Highway Waypoints & City Route Database
 */

const INDIAN_CITIES = [
  { id: 'hyd', name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, alt: 540 },
  { id: 'che', name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707, alt: 10 },
  { id: 'mum', name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, alt: 14 },
  { id: 'del', name: 'Delhi / NCR', lat: 28.6139, lng: 77.2090, alt: 216 },
  { id: 'blr', name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, alt: 920 },
  { id: 'ccu', name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639, alt: 9 },
  { id: 'pne', name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567, alt: 560 },
  { id: 'amd', name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714, alt: 53 },
  { id: 'vtz', name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lng: 83.2185, alt: 45 },
  { id: 'jpr', name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873, alt: 431 },
  { id: 'ngp', name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882, alt: 310 },
  { id: 'sur', name: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311, alt: 13 },
  { id: 'cbe', name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lng: 76.9558, alt: 411 },
  { id: 'lko', name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462, alt: 123 },
  { id: 'goa', name: 'Goa (Panaji)', lat: 15.4909, lng: 73.8278, alt: 10 },
  { id: 'cok', name: 'Kochi, Kerala', lat: 9.9312, lng: 76.2673, alt: 2 },
  { id: 'nel', name: 'Nellore, Andhra Pradesh', lat: 14.4420, lng: 79.9860, alt: 19 },
  { id: 'slp', name: 'Solapur, Maharashtra', lat: 17.6599, lng: 75.9064, alt: 458 },
  { id: 'vja', name: 'Vijayawada, Andhra Pradesh', lat: 16.5060, lng: 80.6480, alt: 18 },
  { id: 'knl', name: 'Kurnool, Andhra Pradesh', lat: 15.8280, lng: 78.0370, alt: 274 },
  { id: 'tpt', name: 'Tirupati, Andhra Pradesh', lat: 13.6288, lng: 79.4192, alt: 160 },
  { id: 'ong', name: 'Ongole, Andhra Pradesh', lat: 15.5050, lng: 80.0490, alt: 10 },
  { id: 'nsk', name: 'Nashik, Maharashtra', lat: 20.0000, lng: 73.7800, alt: 584 },
  { id: 'idr', name: 'Indore, Madhya Pradesh', lat: 22.7196, lng: 75.8577, alt: 553 },
  { id: 'bpl', name: 'Bhopal, Madhya Pradesh', lat: 23.2599, lng: 77.4126, alt: 500 },
  { id: 'bdq', name: 'Vadodara, Gujarat', lat: 22.3072, lng: 73.1812, alt: 39 },
  { id: 'raj', name: 'Rajkot, Gujarat', lat: 22.3039, lng: 70.8022, alt: 128 },
  { id: 'mys', name: 'Mysuru, Karnataka', lat: 12.2958, lng: 76.6394, alt: 763 },
  { id: 'ixe', name: 'Mangaluru, Karnataka', lat: 12.9141, lng: 74.8560, alt: 22 },
  { id: 'ixg', name: 'Belagavi, Karnataka', lat: 15.8497, lng: 74.4977, alt: 762 },
  { id: 'hbk', name: 'Hubballi, Karnataka', lat: 15.3647, lng: 75.1240, alt: 671 },
  { id: 'ixm', name: 'Madurai, Tamil Nadu', lat: 9.9252, lng: 78.1198, alt: 101 },
  { id: 'ccj', name: 'Kozhikode, Kerala', lat: 11.2588, lng: 75.7804, alt: 1 },
  { id: 'pat', name: 'Patna, Bihar', lat: 25.5941, lng: 85.1376, alt: 53 },
  { id: 'ixc', name: 'Chandigarh / Mohali', lat: 30.7333, lng: 76.7794, alt: 321 },
  { id: 'ldh', name: 'Ludhiana, Punjab', lat: 30.9010, lng: 75.8573, alt: 244 },
  { id: 'gau', name: 'Guwahati, Assam', lat: 26.1445, lng: 91.7362, alt: 55 }
];

const PRESET_CORRIDORS = [
  {
    id: 'hyd-che',
    name: 'Hyderabad ➔ Chennai',
    originId: 'hyd',
    destId: 'che',
    origin: { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    destination: { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    distanceKm: 625,
    elevationData: {
      shortestRoute: {
        name: 'NH65/NH16 Direct Highway (Steep Eastern Ghats Cut)',
        distanceKm: 625,
        totalClimbMeters: 1420,
        maxGrade: 6.8,
        avgGrade: 2.2,
        waypoints: [
          [17.3850, 78.4867], // Hyderabad
          [17.0500, 79.2660], // Nalgonda
          [17.1400, 79.6200], // Suryapet
          [16.5060, 80.6480], // Vijayawada
          [15.5050, 80.0490], // Ongole
          [14.4420, 79.9860], // Nellore
          [13.0827, 80.2707]  // Chennai
        ],
        intermediateCities: [
          { name: 'Nalgonda', alt: 210, lat: 17.0500, lng: 79.2660 },
          { name: 'Vijayawada', alt: 18, lat: 16.5060, lng: 80.6480 },
          { name: 'Ongole', alt: 10, lat: 15.5050, lng: 80.0490 },
          { name: 'Nellore', alt: 19, lat: 14.4420, lng: 79.9860 }
        ],
        points: generateElevationProfile(625, 540, 10, [
          { pos: 0.15, alt: 210, city: 'Nalgonda (210m)' },
          { pos: 0.35, alt: 710, city: 'Ghats Cut (710m)' },
          { pos: 0.52, alt: 18, city: 'Vijayawada (18m)' },
          { pos: 0.72, alt: 10, city: 'Ongole (10m)' },
          { pos: 0.88, alt: 19, city: 'Nellore (19m)' }
        ])
      },
      ecoRoute: {
        name: 'NH44/NH40 Deccan Plateau Eco Bypass (Gentle Contour)',
        distanceKm: 648,
        totalClimbMeters: 610,
        maxGrade: 2.9,
        avgGrade: 0.9,
        waypoints: [
          [17.3850, 78.4867], // Hyderabad
          [17.0700, 78.2000], // Shadnagar
          [15.8280, 78.0370], // Kurnool
          [15.4780, 78.4830], // Nandyal
          [14.4670, 78.8240], // Kadapa
          [13.6280, 79.4190], // Tirupati
          [13.0827, 80.2707]  // Chennai
        ],
        intermediateCities: [
          { name: 'Kurnool', alt: 274, lat: 15.8280, lng: 78.0370 },
          { name: 'Nandyal', alt: 210, lat: 15.4780, lng: 78.4830 },
          { name: 'Kadapa', alt: 138, lat: 14.4670, lng: 78.8240 },
          { name: 'Tirupati', alt: 160, lat: 13.6280, lng: 79.4190 }
        ],
        points: generateElevationProfile(648, 540, 10, [
          { pos: 0.25, alt: 274, city: 'Kurnool (274m)' },
          { pos: 0.52, alt: 138, city: 'Kadapa (138m)' },
          { pos: 0.8, alt: 160, city: 'Tirupati (160m)' }
        ])
      }
    }
  },
  {
    id: 'mum-pne',
    name: 'Mumbai ➔ Pune',
    originId: 'mum',
    destId: 'pne',
    origin: { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
    destination: { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    distanceKm: 148,
    elevationData: {
      shortestRoute: {
        name: 'Old NH4 Bhor Ghat Pass (Steep Mountain Hairpins)',
        distanceKm: 148,
        totalClimbMeters: 890,
        maxGrade: 8.5,
        avgGrade: 3.4,
        waypoints: [
          [19.0760, 72.8777], // Mumbai
          [18.9890, 73.1170], // Panvel
          [18.7560, 73.3710], // Khandala Pass
          [18.7550, 73.4090], // Lonavala Summit
          [18.6290, 73.7990], // Pimpri
          [18.5204, 73.8567]  // Pune
        ],
        intermediateCities: [
          { name: 'Panvel', alt: 28, lat: 18.9890, lng: 73.1170 },
          { name: 'Khandala Pass', alt: 550, lat: 18.7560, lng: 73.3710 },
          { name: 'Lonavala Summit', alt: 622, lat: 18.7550, lng: 73.4090 },
          { name: 'Pimpri', alt: 570, lat: 18.6290, lng: 73.7990 }
        ],
        points: generateElevationProfile(148, 14, 560, [
          { pos: 0.25, alt: 28, city: 'Panvel (28m)' },
          { pos: 0.55, alt: 622, city: 'Lonavala (622m)' },
          { pos: 0.85, alt: 570, city: 'Pimpri (570m)' }
        ])
      },
      ecoRoute: {
        name: 'Mumbai-Pune Expressway Gradient Contour',
        distanceKm: 154,
        totalClimbMeters: 380,
        maxGrade: 3.2,
        avgGrade: 1.2,
        waypoints: [
          [19.0760, 72.8777], // Mumbai
          [19.0330, 73.0290], // Navi Mumbai
          [18.9500, 73.2000], // Expressway Bypass
          [18.7200, 73.5000], // Talegaon
          [18.5204, 73.8567]  // Pune
        ],
        intermediateCities: [
          { name: 'Navi Mumbai', alt: 10, lat: 19.0330, lng: 73.0290 },
          { name: 'Expressway Viaduct', alt: 420, lat: 18.9500, lng: 73.2000 },
          { name: 'Talegaon', alt: 660, lat: 18.7200, lng: 73.5000 }
        ],
        points: generateElevationProfile(154, 14, 560, [
          { pos: 0.2, alt: 10, city: 'Navi Mumbai (10m)' },
          { pos: 0.55, alt: 420, city: 'Expressway Viaduct (420m)' },
          { pos: 0.82, alt: 660, city: 'Talegaon (660m)' }
        ])
      }
    }
  },
  {
    id: 'mum-del',
    name: 'Mumbai ➔ Delhi',
    originId: 'mum',
    destId: 'del',
    origin: { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
    destination: { name: 'Delhi / NCR', lat: 28.6139, lng: 77.2090 },
    distanceKm: 1415,
    elevationData: {
      shortestRoute: {
        name: 'NH48 Western Corridor (Kasara Ghat & Malwa Incline)',
        distanceKm: 1415,
        totalClimbMeters: 2850,
        maxGrade: 7.5,
        avgGrade: 2.4,
        waypoints: [
          [19.0760, 72.8777], // Mumbai
          [21.1700, 72.8310], // Surat
          [22.3070, 73.1810], // Vadodara
          [23.0220, 72.5710], // Ahmedabad
          [24.5850, 73.7120], // Udaipur
          [26.9120, 75.7870], // Jaipur
          [28.6139, 77.2090]  // Delhi
        ],
        intermediateCities: [
          { name: 'Surat', alt: 13, lat: 21.1700, lng: 72.8310 },
          { name: 'Ahmedabad', alt: 53, lat: 23.0220, lng: 72.5710 },
          { name: 'Udaipur', alt: 598, lat: 24.5850, lng: 73.7120 },
          { name: 'Jaipur', alt: 431, lat: 26.9120, lng: 75.7870 }
        ],
        points: generateElevationProfile(1415, 14, 216, [
          { pos: 0.2, alt: 13, city: 'Surat (13m)' },
          { pos: 0.38, alt: 53, city: 'Ahmedabad (53m)' },
          { pos: 0.58, alt: 598, city: 'Udaipur (598m)' },
          { pos: 0.82, alt: 431, city: 'Jaipur (431m)' }
        ])
      },
      ecoRoute: {
        name: 'Delhi-Mumbai Freight Expressway Eco Contour',
        distanceKm: 1440,
        totalClimbMeters: 1290,
        maxGrade: 3.1,
        avgGrade: 1.1,
        waypoints: [
          [19.0760, 72.8777], // Mumbai
          [20.0000, 73.7800], // Nashik
          [21.1458, 79.0882], // Ratlam
          [26.9120, 75.7870], // Kota
          [28.6139, 77.2090]  // Delhi
        ],
        intermediateCities: [
          { name: 'Nashik', alt: 584, lat: 20.0000, lng: 73.7800 },
          { name: 'Ratlam Plain', alt: 480, lat: 23.3300, lng: 75.0300 },
          { name: 'Kota Bypass', alt: 271, lat: 25.2100, lng: 75.8600 }
        ],
        points: generateElevationProfile(1440, 14, 216, [
          { pos: 0.25, alt: 584, city: 'Nashik (584m)' },
          { pos: 0.55, alt: 480, city: 'Ratlam Plain (480m)' },
          { pos: 0.8, alt: 271, city: 'Kota Bypass (271m)' }
        ])
      }
    }
  },
  {
    id: 'blr-hyd',
    name: 'Bengaluru ➔ Hyderabad',
    originId: 'blr',
    destId: 'hyd',
    origin: { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    destination: { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    distanceKm: 569,
    elevationData: {
      shortestRoute: {
        name: 'NH44 Direct Highway (Deccan Ridge Hill Cut)',
        distanceKm: 569,
        totalClimbMeters: 1150,
        maxGrade: 5.2,
        avgGrade: 1.8,
        waypoints: [
          [12.9716, 77.5946], // Bengaluru
          [13.4320, 77.7270], // Chikballapur
          [14.6810, 77.6000], // Anantapur
          [15.8280, 78.0370], // Kurnool
          [16.7480, 77.9850], // Mahbubnagar
          [17.3850, 78.4867]  // Hyderabad
        ],
        intermediateCities: [
          { name: 'Chikballapur', alt: 915, lat: 13.4320, lng: 77.7270 },
          { name: 'Anantapur', alt: 335, lat: 14.6810, lng: 77.6000 },
          { name: 'Kurnool', alt: 274, lat: 15.8280, lng: 78.0370 },
          { name: 'Mahbubnagar', alt: 498, lat: 16.7480, lng: 77.9850 }
        ],
        points: generateElevationProfile(569, 920, 540, [
          { pos: 0.12, alt: 915, city: 'Chikballapur (915m)' },
          { pos: 0.38, alt: 335, city: 'Anantapur (335m)' },
          { pos: 0.64, alt: 274, city: 'Kurnool (274m)' },
          { pos: 0.82, alt: 498, city: 'Mahbubnagar (498m)' }
        ])
      },
      ecoRoute: {
        name: 'NH44 Anantapur Valley Eco Route',
        distanceKm: 582,
        totalClimbMeters: 520,
        maxGrade: 2.4,
        avgGrade: 0.8,
        waypoints: [
          [12.9716, 77.5946], // Bengaluru
          [13.8000, 77.5000], // Penukonda Bypass
          [14.6810, 77.6000], // Anantapur
          [15.8280, 78.0370], // Kurnool Bypass
          [17.3850, 78.4867]  // Hyderabad
        ],
        intermediateCities: [
          { name: 'Penukonda', alt: 600, lat: 13.8000, lng: 77.5000 },
          { name: 'Anantapur Valley', alt: 330, lat: 14.6810, lng: 77.6000 },
          { name: 'Kurnool Bypass', alt: 270, lat: 15.8280, lng: 78.0370 }
        ],
        points: generateElevationProfile(582, 920, 540, [
          { pos: 0.25, alt: 600, city: 'Penukonda (600m)' },
          { pos: 0.5, alt: 330, city: 'Anantapur Valley (330m)' },
          { pos: 0.75, alt: 270, city: 'Kurnool Bypass (270m)' }
        ])
      }
    }
  },
  {
    id: 'hyd-del',
    name: 'Hyderabad ➔ Delhi / NCR',
    originId: 'hyd',
    destId: 'del',
    origin: { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    destination: { name: 'Delhi / NCR', lat: 28.6139, lng: 77.2090 },
    distanceKm: 1543,
    elevationData: {
      shortestRoute: {
        name: 'NH44 North-South Direct Highway',
        distanceKm: 1580,
        totalClimbMeters: 2240,
        maxGrade: 6.2,
        avgGrade: 1.9,
        waypoints: [
          [17.3850, 78.4867], // Hyderabad
          [19.0680, 78.3480], // Nirmal
          [21.1458, 79.0882], // Nagpur
          [22.0860, 79.5420], // Seoni Pass
          [25.4484, 78.5685], // Jhansi
          [26.2183, 78.1772], // Gwalior
          [27.1767, 78.0081], // Agra
          [28.6139, 77.2090]  // Delhi
        ],
        intermediateCities: [
          { name: 'Nirmal', alt: 340, lat: 19.0680, lng: 78.3480 },
          { name: 'Nagpur', alt: 310, lat: 21.1458, lng: 79.0882 },
          { name: 'Seoni Pass', alt: 615, lat: 22.0860, lng: 79.5420 },
          { name: 'Jhansi', alt: 285, lat: 25.4484, lng: 78.5685 },
          { name: 'Agra', alt: 171, lat: 27.1767, lng: 78.0081 }
        ],
        points: generateElevationProfile(1580, 466, 216, [
          { pos: 0.15, alt: 340, city: 'Nirmal (340m)' },
          { pos: 0.35, alt: 310, city: 'Nagpur (310m)' },
          { pos: 0.52, alt: 615, city: 'Seoni Pass (615m)' },
          { pos: 0.72, alt: 285, city: 'Jhansi (285m)' },
          { pos: 0.88, alt: 171, city: 'Agra (171m)' }
        ])
      },
      ecoRoute: {
        name: 'NH161 & NE4 Expressway (Google Maps Preferred 1,543 km)',
        distanceKm: 1543,
        totalClimbMeters: 980,
        maxGrade: 2.8,
        avgGrade: 0.9,
        waypoints: [
          [17.3850, 78.4867], // Hyderabad
          [19.1383, 77.3210], // Nanded
          [22.7196, 75.8577], // Indore
          [25.2138, 75.8648], // Kota Expressway
          [26.9120, 75.7870], // Jaipur
          [28.6139, 77.2090]  // Delhi
        ],
        intermediateCities: [
          { name: 'Nanded', alt: 362, lat: 19.1383, lng: 77.3210 },
          { name: 'Indore', alt: 553, lat: 22.7196, lng: 75.8577 },
          { name: 'Kota Bypass', alt: 271, lat: 25.2138, lng: 75.8648 },
          { name: 'Jaipur Expressway', alt: 431, lat: 26.9120, lng: 75.7870 }
        ],
        points: generateElevationProfile(1543, 466, 216, [
          { pos: 0.2, alt: 362, city: 'Nanded (362m)' },
          { pos: 0.45, alt: 553, city: 'Indore (553m)' },
          { pos: 0.72, alt: 271, city: 'Kota Bypass (271m)' },
          { pos: 0.88, alt: 431, city: 'Jaipur Expressway (431m)' }
        ])
      }
    }
  },
  {
    id: 'del-hyd',
    name: 'Delhi / NCR ➔ Hyderabad',
    originId: 'del',
    destId: 'hyd',
    origin: { name: 'Delhi / NCR', lat: 28.6139, lng: 77.2090 },
    destination: { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    distanceKm: 1543,
    elevationData: {
      shortestRoute: {
        name: 'NH44 Southbound Expressway',
        distanceKm: 1580,
        totalClimbMeters: 2240,
        maxGrade: 6.2,
        avgGrade: 1.9,
        waypoints: [
          [28.6139, 77.2090], // Delhi
          [27.1767, 78.0081], // Agra
          [25.4484, 78.5685], // Jhansi
          [21.1458, 79.0882], // Nagpur
          [17.3850, 78.4867]  // Hyderabad
        ],
        intermediateCities: [
          { name: 'Agra', alt: 171, lat: 27.1767, lng: 78.0081 },
          { name: 'Jhansi', alt: 285, lat: 25.4484, lng: 78.5685 },
          { name: 'Nagpur', alt: 310, lat: 21.1458, lng: 79.0882 }
        ],
        points: generateElevationProfile(1580, 216, 466, [
          { pos: 0.15, alt: 171, city: 'Agra (171m)' },
          { pos: 0.45, alt: 285, city: 'Jhansi (285m)' },
          { pos: 0.75, alt: 310, city: 'Nagpur (310m)' }
        ])
      },
      ecoRoute: {
        name: 'NE4 & NH161 Expressway (Google Maps Preferred 1,543 km)',
        distanceKm: 1543,
        totalClimbMeters: 980,
        maxGrade: 2.8,
        avgGrade: 0.9,
        waypoints: [
          [28.6139, 77.2090], // Delhi
          [26.9120, 75.7870], // Jaipur
          [25.2138, 75.8648], // Kota
          [22.7196, 75.8577], // Indore
          [17.3850, 78.4867]  // Hyderabad
        ],
        intermediateCities: [
          { name: 'Jaipur Expressway', alt: 431, lat: 26.9120, lng: 75.7870 },
          { name: 'Kota Bypass', alt: 271, lat: 25.2138, lng: 75.8648 },
          { name: 'Indore', alt: 553, lat: 22.7196, lng: 75.8577 }
        ],
        points: generateElevationProfile(1543, 216, 466, [
          { pos: 0.2, alt: 431, city: 'Jaipur Expressway (431m)' },
          { pos: 0.5, alt: 271, city: 'Kota Bypass (271m)' },
          { pos: 0.75, alt: 553, city: 'Indore (553m)' }
        ])
      }
    }
  }
];

/**
 * Generate elevation profile points - Tag each city EXACTLY ONCE at its single closest step index
 */
function generateElevationProfile(totalDistance, startAlt, endAlt, keyWaypoints) {
  const steps = 40;
  const profile = [];

  // Map each keyWaypoint to its single closest step index
  const cityIndexMap = {};
  keyWaypoints.forEach(wp => {
    if (wp.city) {
      const closestStep = Math.round(wp.pos * steps);
      cityIndexMap[closestStep] = wp.city;
    }
  });
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const dist = Math.round(ratio * totalDistance);
    
    let baseAlt = startAlt + (endAlt - startAlt) * ratio;
    
    keyWaypoints.forEach(wp => {
      const distFromWp = Math.abs(ratio - wp.pos);
      const influence = Math.exp(-Math.pow(distFromWp / 0.12, 2));
      baseAlt += (wp.alt - baseAlt) * influence * 0.75;
    });
    
    const noise = Math.sin(ratio * Math.PI * 8) * 10 + Math.cos(ratio * Math.PI * 15) * 6;
    const altitude = Math.max(5, Math.round(baseAlt + noise));
    
    profile.push({
      distanceKm: dist,
      altitudeMeters: altitude,
      city: cityIndexMap[i] || null // EXACT SINGLE INDEX MATCH
    });
  }
  
  return profile;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Perpendicular distance in km from point (pLat, pLng) to line segment (aLat, aLng) -> (bLat, bLng)
 */
function distanceToSegmentKm(pLat, pLng, aLat, aLng, bLat, bLng) {
  const cosLat = Math.cos((aLat * Math.PI) / 180);
  const px = (pLng - aLng) * 111.32 * cosLat;
  const py = (pLat - aLat) * 111.32;
  const bx = (bLng - aLng) * 111.32 * cosLat;
  const by = (bLat - aLat) * 111.32;

  const l2 = bx * bx + by * by;
  if (l2 === 0) return Math.sqrt(px * px + py * py);

  let t = (px * bx + py * by) / l2;
  t = Math.max(0, Math.min(1, t));

  const projX = t * bx;
  const projY = t * by;

  const dx = px - projX;
  const dy = py - projY;
  return Math.sqrt(dx * dx + dy * dy);
}

function segmentFraction(pLat, pLng, aLat, aLng, bLat, bLng) {
  const cosLat = Math.cos((aLat * Math.PI) / 180);
  const px = (pLng - aLng) * 111.32 * cosLat;
  const py = (pLat - aLat) * 111.32;
  const bx = (bLng - aLng) * 111.32 * cosLat;
  const by = (bLat - aLat) * 111.32;

  const l2 = bx * bx + by * by;
  if (l2 === 0) return 0;

  let t = (px * bx + py * by) / l2;
  return Math.max(0, Math.min(1, t));
}

/**
 * Traverse the actual road polyline coordinates and find real cities from the database
 * that fall within maxDistanceKm of the displayed road path, sorted strictly chronologically.
 */
function findCitiesAlongRoadPath(roadCoords, citiesDatabase, originId, destId, maxDistanceKm = 30) {
  if (!roadCoords || roadCoords.length < 2 || !citiesDatabase) return [];

  const cumDistances = [0];
  let totalKm = 0;
  for (let i = 0; i < roadCoords.length - 1; i++) {
    const segDist = calculateHaversineDistance(
      roadCoords[i][0], roadCoords[i][1],
      roadCoords[i + 1][0], roadCoords[i + 1][1]
    );
    totalKm += segDist;
    cumDistances.push(totalKm);
  }

  const matched = [];

  citiesDatabase.forEach(city => {
    if (city.id === originId || city.id === destId) return;

    let minDistanceToRoad = Infinity;
    let closestDistanceAlongRoad = 0;

    for (let i = 0; i < roadCoords.length - 1; i++) {
      const p1 = roadCoords[i];
      const p2 = roadCoords[i + 1];

      const distToSeg = distanceToSegmentKm(city.lat, city.lng, p1[0], p1[1], p2[0], p2[1]);
      if (distToSeg < minDistanceToRoad) {
        minDistanceToRoad = distToSeg;
        const frac = segmentFraction(city.lat, city.lng, p1[0], p1[1], p2[0], p2[1]);
        const segLen = (cumDistances[i + 1] - cumDistances[i]);
        closestDistanceAlongRoad = cumDistances[i] + (frac * segLen);
      }
    }

    if (minDistanceToRoad <= maxDistanceKm) {
      matched.push({
        id: city.id,
        name: city.name,
        cleanName: city.name.split(',')[0].trim(),
        lat: city.lat,
        lng: city.lng,
        alt: city.alt,
        distanceAlongRoadKm: Math.round(closestDistanceAlongRoad),
        distFromRoadKm: Math.round(minDistanceToRoad * 10) / 10
      });
    }
  });

  matched.sort((a, b) => a.distanceAlongRoadKm - b.distanceAlongRoadKm);

  const result = [];
  matched.forEach(c => {
    if (result.length === 0 || (c.distanceAlongRoadKm - result[result.length - 1].distanceAlongRoadKm) > 10) {
      result.push(c);
    }
  });

  return result;
}

window.INDIAN_CITIES = INDIAN_CITIES;
window.PRESET_CORRIDORS = PRESET_CORRIDORS;
window.calculateHaversineDistance = calculateHaversineDistance;
window.distanceToSegmentKm = distanceToSegmentKm;
window.segmentFraction = segmentFraction;
window.findCitiesAlongRoadPath = findCitiesAlongRoadPath;
window.generateElevationProfile = generateElevationProfile;
