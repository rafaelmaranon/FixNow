import express from "express";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import pLimit from "p-limit";
import fs from "fs";
import cors from "cors";

/** Craigslist service categories we'll use (RSS, SF Bay area) */
const FEEDS = [
  // Household Services (hss) + Skilled Trade Services (sks), focused queries
  "https://sfbay.craigslist.org/search/sfc/hss?query=plumbing%7Chandyman%7Celectrician%7Chvac&format=rss",
  "https://sfbay.craigslist.org/search/sfc/sks?query=plumbing%7Chandyman%7Celectrician%7Chvac&format=rss"
];

const parser = new XMLParser({ ignoreAttributes: false });

// Robust fetching configuration
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const POST_RE = /^https?:\/\/sfbay\.craigslist\.org\/sfc\/(hss|sks)\/.+\/\d+\.html$/i;
const SNAPSHOT_FILE = "./cl_contractors_snapshot.json";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// In-memory cache
let contractorCache = {
  data: [],
  timestamp: 0,
  isRefreshing: false
};

/** Neighborhood definitions with aliases */
const HOODS = {
  marina: ["marina", "marina district", "cow hollow", "palace of fine arts", "chestnut", "union street", "crissy field", "lombard street", "fillmore street"],
  mission: ["mission", "mission district", "valencia", "24th street", "16th street", "dolores", "castro", "noe valley"],
  pac_heights: ["pacific heights", "pac heights", "fillmore", "california street", "sacramento street", "presidio heights"],
  presidio: ["presidio", "presidio heights", "laurel heights", "arguello"],
  soma: ["soma", "south of market", "folsom", "howard", "bryant", "harrison", "financial district", "downtown"],
  sunset: ["sunset", "outer sunset", "inner sunset", "taraval", "noriega", "judah", "irving"],
  richmond: ["richmond", "outer richmond", "inner richmond", "geary", "clement", "balboa"],
  haight: ["haight", "haight ashbury", "lower haight", "upper haight", "panhandle", "divisadero"],
  nob_hill: ["nob hill", "russian hill", "north beach", "chinatown", "telegraph hill"],
  castro: ["castro", "upper market", "twin peaks", "eureka valley"]
};

const NEARBY = {
  marina: ["marina", "pac_heights", "presidio", "nob_hill"],
  mission: ["mission", "castro", "soma", "haight"],
  pac_heights: ["pac_heights", "marina", "presidio", "nob_hill"],
  presidio: ["presidio", "marina", "pac_heights", "richmond"],
  soma: ["soma", "mission", "nob_hill", "castro"],
  sunset: ["sunset", "richmond", "haight"],
  richmond: ["richmond", "sunset", "presidio"],
  haight: ["haight", "mission", "castro", "sunset"],
  nob_hill: ["nob_hill", "marina", "pac_heights", "soma"],
  castro: ["castro", "mission", "haight", "soma"]
};

/** Check if text matches a neighborhood */
function textMatchesHood(text, hoodKey, loose = false) {
  const t = text.toLowerCase();
  const keys = loose ? (NEARBY[hoodKey] || [hoodKey]) : [hoodKey];
  return keys.some(k => (HOODS[k] || []).some(alias => t.includes(alias)));
}

/** Filter items by neighborhood */
function filterByHood(items, hoodKey, mode = "strict") {
  if (!hoodKey || hoodKey === 'all') return items;
  
  return items.filter(item => {
    const searchText = `${item.title || ''} ${item.description || ''} ${item.summary || ''}`;
    return textMatchesHood(searchText, hoodKey, mode === "loose");
  });
}

/** Simple classifier for card badge */
function classify(text) {
  const t = text.toLowerCase();
  if (/(plumb|leak|drain|toilet|sink|pipe)/.test(t)) return "Plumbing";
  if (/(electri|outlet|breaker|fuse|light|switch|smoke|wire)/.test(t)) return "Electrical";
  if (/(hvac|furnace|ac|heater|thermostat|cooling|heating)/.test(t)) return "HVAC";
  if (/(carpet|wood|cabinet|paint|drywall|tile)/.test(t)) return "Carpentry";
  return "Handyman";
}

/** Extract neighborhood from title for approximate location */
function extractNeighborhood(text) {
  const neighborhoods = {
    'mission': [37.7599, -122.4148],
    'sunset': [37.7537, -122.4804],
    'richmond': [37.7806, -122.4644],
    'castro': [37.7609, -122.4350],
    'soma': [37.7749, -122.4194],
    'nob hill': [37.7946, -122.4094],
    'chinatown': [37.7941, -122.4078],
    'financial': [37.7946, -122.3999],
    'marina': [37.8021, -122.4416],
    'haight': [37.7699, -122.4469]
  };
  
  const lowerText = text.toLowerCase();
  for (const [name, coords] of Object.entries(neighborhoods)) {
    if (lowerText.includes(name)) {
      return { name, lat: coords[0], lng: coords[1] };
    }
  }
  
  // Default to downtown SF
  return { name: 'San Francisco', lat: 37.7749, lng: -122.4194 };
}

/** Generate mock rating and pricing for demo */
function generateMockData(category) {
  const ratings = [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8];
  const priceRanges = {
    'Plumbing': ['$$', '$$$'],
    'Electrical': ['$', '$$'],
    'HVAC': ['$$', '$$$'],
    'Carpentry': ['$', '$$'],
    'Handyman': ['$', '$$']
  };
  
  return {
    rating: ratings[Math.floor(Math.random() * ratings.length)],
    priceRange: priceRanges[category]?.[Math.floor(Math.random() * priceRanges[category].length)] || '$',
    eta: `${15 + Math.floor(Math.random() * 45)} min`,
    distance: `${(0.3 + Math.random() * 2.5).toFixed(1)} mi`
  };
}

/** Map RSS item -> Contractor Profile */
function toContractorProfile(item) {
  const title = (item.title || "").trim();
  const desc = (item.description || "").trim();
  const link = item.link;
  const id = item.guid?.["#text"] || link;
  const category = classify(`${title} ${desc}`);
  const location = extractNeighborhood(title);
  const mockData = generateMockData(category);

  // Clean up contractor name from title
  let name = title.replace(/[\|\-–].*$/, "").trim();
  name = name.replace(/\b(plumber|electrician|hvac|handyman|contractor|service|repair)\b/gi, "").trim();
  name = name || `${category} Specialist`;

  return {
    id,
    source: "craigslist",
    name: name.length > 50 ? name.substring(0, 47) + "..." : name,
    category,
    summary: title.length > 100 ? title.substring(0, 97) + "..." : title,
    service_area: location.name,
    rating: mockData.rating,
    priceRange: mockData.priceRange,
    eta: mockData.eta,
    distance: mockData.distance,
    lat: location.lat,
    lng: location.lng,
    external_url: link,
    published_at: item.pubDate || null
  };
}

/** Fetch RSS feed with proper headers */
async function fetchRSS(url) {
  try {
    console.log(`📡 Fetching RSS: ${url}`);
    const response = await fetch(url, { 
      headers: { "User-Agent": UA },
      timeout: 10000
    });
    
    if (!response.ok) {
      console.error(`❌ RSS fetch failed: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const feed = parser.parse(xml);
    let items = feed?.rss?.channel?.item ?? [];
    items = Array.isArray(items) ? items : [items];
    console.log(`✅ Found ${items.length} RSS items`);
    return items;
  } catch (error) {
    console.error(`❌ RSS error:`, error.message);
    return [];
  }
}

/** Map RSS item to contractor profile */
function mapRSSItem(item) {
  const title = (item.title || "").trim();
  const link = item.link;
  const id = item.guid?.["#text"] || link;
  
  // Clean up contractor name
  let name = title.replace(/[\|\-–].*$/, "").trim();
  name = name.replace(/\b(plumber|electrician|hvac|handyman|contractor|service|repair)\b/gi, "").trim();
  name = name || "Contractor";
  
  return {
    id,
    name: name.length > 50 ? name.substring(0, 47) + "..." : name,
    summary: title.length > 100 ? title.substring(0, 97) + "..." : title,
    external_url: link,
    source: "craigslist",
    service_area: "San Francisco",
    category: classify(title),
    published_at: item.pubDate || null
  };
}

/** Validate a Craigslist URL (throttled) */
async function validateURL(url) {
  if (!POST_RE.test(url)) {
    console.log(`⚠️  Invalid URL pattern: ${url}`);
    return null;
  }
  
  try {
    console.log(`🔍 Validating: ${url}`);
    const response = await fetch(url, { 
      headers: { "User-Agent": UA },
      timeout: 8000
    });
    
    if (!response.ok) {
      console.log(`❌ Validation failed (${response.status}): ${url}`);
      return null;
    }
    
    const html = await response.text();
    const isValid = html.includes('id="postingbody"') || html.includes('postinginfos');
    
    if (isValid) {
      console.log(`✅ Valid post: ${url}`);
      return url;
    } else {
      console.log(`❌ Invalid post content: ${url}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Validation error: ${error.message}`);
    return null;
  }
}

/** Generate mock Craigslist-style contractor data for demo */
function generateMockContractors(limit = 100) {
  const mockListings = [
    { title: "Licensed Plumber - Emergency Repairs 24/7 - Mission District", category: "Plumbing", area: "mission" },
    { title: "Experienced Electrician - Outlets, Panels, Lighting - Castro", category: "Electrical", area: "castro" },
    { title: "HVAC Technician - Furnace & AC Repair - Sunset", category: "HVAC", area: "sunset" },
    { title: "Handyman Services - Carpentry, Painting, Repairs - Richmond", category: "Handyman", area: "richmond" },
    { title: "Master Plumber - Leak Detection & Pipe Repair - SOMA", category: "Plumbing", area: "soma" },
    { title: "Certified Electrician - Panel Upgrades & Rewiring - Marina", category: "Electrical", area: "marina" },
    { title: "AC Repair Specialist - Same Day Service - Nob Hill", category: "HVAC", area: "nob hill" },
    { title: "Kitchen Cabinet Installation - Custom Carpentry - Haight", category: "Carpentry", area: "haight" },
    { title: "Emergency Plumbing - Drain Cleaning & Water Heaters", category: "Plumbing", area: "financial" },
    { title: "Residential Electrician - GFCI, Smoke Detectors, Fans", category: "Electrical", area: "chinatown" },
    { title: "Heating Repair - Boiler & Radiator Service - Mission", category: "HVAC", area: "mission" },
    { title: "Tile & Bathroom Remodeling - Licensed Contractor", category: "Carpentry", area: "sunset" },
    { title: "24hr Plumber - Toilet Repair & Installation - Castro", category: "Plumbing", area: "castro" },
    { title: "Solar Panel Installation - Licensed Electrical Work", category: "Electrical", area: "richmond" },
    { title: "Ductwork Cleaning & HVAC Maintenance - Certified Tech", category: "HVAC", area: "soma" },
    { title: "Drywall Repair & Interior Painting - Handyman", category: "Handyman", area: "marina" },
    { title: "Water Damage Restoration - Plumbing & Cleanup", category: "Plumbing", area: "nob hill" },
    { title: "Electrical Troubleshooting - Circuit Breakers & Wiring", category: "Electrical", area: "haight" },
    { title: "Thermostat Installation - Smart Home HVAC Setup", category: "HVAC", area: "financial" },
    { title: "Deck Building & Fence Installation - Carpentry", category: "Carpentry", area: "chinatown" }
  ];

  const contractors = [];
  
  for (let i = 0; i < Math.min(limit, mockListings.length * 3); i++) {
    const listing = mockListings[i % mockListings.length];
    const id = `cl-${Date.now()}-${i}`;
    
    // Create mock RSS item
    const mockItem = {
      title: listing.title,
      description: `Professional ${listing.category.toLowerCase()} services in San Francisco. Licensed, insured, and experienced.`,
      link: `https://sfbay.craigslist.org/sfc/hss/d/${id}.html`,
      guid: { "#text": id },
      pubDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    contractors.push(toContractorProfile(mockItem));
  }
  
  console.log(`📋 Generated ${contractors.length} mock contractors (simulating Craigslist data)`);
  return contractors;
}

/** Load snapshot from disk */
function loadSnapshot() {
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
      console.log(`📂 Loaded ${data.contractors?.length || 0} contractors from snapshot`);
      return data.contractors || [];
    }
  } catch (error) {
    console.error(`❌ Failed to load snapshot:`, error.message);
  }
  return [];
}

/** Save snapshot to disk */
function saveSnapshot(contractors) {
  try {
    const data = { 
      contractors, 
      timestamp: new Date().toISOString(),
      count: contractors.length 
    };
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Saved ${contractors.length} contractors to snapshot`);
  } catch (error) {
    console.error(`❌ Failed to save snapshot:`, error.message);
  }
}

/** Robust contractor fetching with throttling and fallback */
async function fetchContractorsRobust(limit = 40) {
  console.log(`🔍 Starting robust contractor fetch (limit: ${limit})`);
  
  try {
    // 1) Discover posts via RSS
    const seen = new Set();
    const rawItems = [];
    
    for (const feedUrl of FEEDS) {
      const items = await fetchRSS(feedUrl);
      for (const item of items) {
        const link = item.link;
        if (!link || seen.has(link)) continue;
        seen.add(link);
        rawItems.push(mapRSSItem(item));
      }
    }
    
    console.log(`📡 Discovered ${rawItems.length} posts from RSS feeds`);
    
    if (rawItems.length === 0) {
      console.log(`⚠️  No RSS data available, using fallback`);
      return loadSnapshot();
    }
    
    // 2) Validate posts with heavy throttling (1 req/sec max)
    const limiter = pLimit(1);
    const validatedContractors = [];
    
    for (const item of rawItems.slice(0, limit * 2)) { // Try more than limit to account for failures
      if (validatedContractors.length >= limit) break;
      
      const isValid = await limiter(() => validateURL(item.external_url));
      if (isValid) {
        // Add mock data for demo completeness
        const mockData = generateMockData(item.category);
        validatedContractors.push({
          ...item,
          rating: mockData.rating,
          priceRange: mockData.priceRange,
          eta: mockData.eta,
          distance: mockData.distance,
          lat: 37.7749 + (Math.random() - 0.5) * 0.1,
          lng: -122.4194 + (Math.random() - 0.5) * 0.1
        });
      }
      
      // Extra throttling - be very respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Validated ${validatedContractors.length} contractors`);
    
    // 3) Save snapshot if we got results
    if (validatedContractors.length > 0) {
      saveSnapshot(validatedContractors);
      return validatedContractors;
    }
    
  } catch (error) {
    console.error(`❌ Robust fetch error:`, error.message);
  }
  
  // 4) Fallback to snapshot or mock data
  console.log(`⚠️  Falling back to snapshot/mock data`);
  const snapshot = loadSnapshot();
  return snapshot.length > 0 ? snapshot : generateMockContractors(limit);
}

/** Get contractors with caching */
async function getContractors(limit = 40) {
  const now = Date.now();
  
  // Return cached data if fresh
  if (contractorCache.data.length > 0 && (now - contractorCache.timestamp) < CACHE_DURATION) {
    console.log(`📋 Returning cached contractors (${contractorCache.data.length})`);
    return contractorCache.data.slice(0, limit);
  }
  
  // If already refreshing, return cached data or snapshot
  if (contractorCache.isRefreshing) {
    console.log(`⏳ Refresh in progress, returning cached/snapshot data`);
    return contractorCache.data.length > 0 ? contractorCache.data.slice(0, limit) : loadSnapshot().slice(0, limit);
  }
  
  // Start refresh
  contractorCache.isRefreshing = true;
  
  try {
    const contractors = await fetchContractorsRobust(limit);
    contractorCache.data = contractors;
    contractorCache.timestamp = now;
    console.log(`🔄 Cache refreshed with ${contractors.length} contractors`);
    return contractors.slice(0, limit);
  } catch (error) {
    console.error(`❌ Cache refresh failed:`, error.message);
    return contractorCache.data.length > 0 ? contractorCache.data.slice(0, limit) : loadSnapshot().slice(0, limit);
  } finally {
    contractorCache.isRefreshing = false;
  }
}

/* --- Minimal API --- */
const app = express();
app.use(cors());
app.use(express.json());

app.get("/contractors/sf", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    const category = req.query.category;
    const neighborhood = req.query.neighborhood;
    const mode = req.query.mode || "strict"; // strict or loose
    
    console.log(`🎯 Request: limit=${limit}, category=${category || 'all'}, neighborhood=${neighborhood || 'all'}, mode=${mode}`);
    
    let data = await getContractors(limit * 3); // Fetch more to allow filtering
    
    // Filter by neighborhood first (most restrictive)
    if (neighborhood && neighborhood !== 'all') {
      const beforeCount = data.length;
      data = filterByHood(data, neighborhood, mode);
      console.log(`📍 Neighborhood filter (${neighborhood}, ${mode}): ${beforeCount} → ${data.length} contractors`);
    }
    
    // Filter by category if specified
    if (category && category !== 'all') {
      const beforeCount = data.length;
      data = data.filter(c => c.category.toLowerCase() === category.toLowerCase());
      console.log(`🏷️ Category filter (${category}): ${beforeCount} → ${data.length} contractors`);
    }
    
    // Limit results
    data = data.slice(0, limit);
    
    res.json({ 
      success: true,
      count: data.length, 
      contractors: data,
      filters: {
        neighborhood: neighborhood || 'all',
        category: category || 'all',
        mode: mode
      },
      available_neighborhoods: Object.keys(HOODS),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in /contractors/sf:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch contractors',
      count: 0,
      contractors: []
    });
  }
});

// Get available neighborhoods
app.get("/neighborhoods", (req, res) => {
  res.json({
    success: true,
    neighborhoods: Object.keys(HOODS).map(key => ({
      key,
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      aliases: HOODS[key].slice(0, 3) // Show first 3 aliases
    }))
  });
});

// Manual refresh endpoint (for demo preparation)
app.post("/refresh", async (req, res) => {
  console.log(`🔄 Manual refresh requested`);
  
  try {
    // Force cache refresh
    contractorCache.timestamp = 0;
    contractorCache.isRefreshing = false;
    
    const contractors = await getContractors(40);
    
    res.json({
      success: true,
      message: "Cache refreshed successfully",
      count: contractors.length,
      cached: contractorCache.data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ Manual refresh failed:`, error);
    res.status(500).json({
      success: false,
      error: "Refresh failed",
      message: error.message
    });
  }
});

// Cache status endpoint
app.get("/status", (req, res) => {
  const snapshot = loadSnapshot();
  
  res.json({
    success: true,
    cache: {
      count: contractorCache.data.length,
      age_minutes: Math.round((Date.now() - contractorCache.timestamp) / 60000),
      is_refreshing: contractorCache.isRefreshing
    },
    snapshot: {
      exists: fs.existsSync(SNAPSHOT_FILE),
      count: snapshot.length
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Craigslist Contractors Service is running",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`🚀 Craigslist contractors server running on http://localhost:${PORT}`);
  console.log(`📡 Contractors endpoint: http://localhost:${PORT}/contractors/sf`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
