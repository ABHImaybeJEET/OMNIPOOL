import React, { useEffect, useRef, useState } from "react";
import type { HardwareItem } from "../../store/useStore";
import { Search, MapPin, Compass, ChevronRight, ChevronLeft, Layers } from "lucide-react";

declare const L: any;

interface HardwareMapProps {
  items: HardwareItem[];
  onRequestHardware: (item: HardwareItem) => void;
  focusedItem: HardwareItem | null;
  onClearFocusedItem: () => void;
}

// Category styles helper
const categoryStyles: Record<
  string,
  { color: string; bg: string; border: string; label: string; svg: string }
> = {
  compute: {
    color: "#8C7B9E",
    bg: "rgba(140, 123, 158, 0.1)",
    border: "rgba(140, 123, 158, 0.4)",
    label: "Compute",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
  },
  microcontrollers: {
    color: "#8C7B9E",
    bg: "rgba(140, 123, 158, 0.1)",
    border: "rgba(140, 123, 158, 0.4)",
    label: "Microcontroller",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
  },
  development_boards: {
    color: "#8C7B9E",
    bg: "rgba(140, 123, 158, 0.1)",
    border: "rgba(140, 123, 158, 0.4)",
    label: "Dev Board",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></svg>`,
  },
  sensor: {
    color: "#84a59d",
    bg: "rgba(132, 165, 157, 0.1)",
    border: "rgba(132, 165, 157, 0.4)",
    label: "Sensor",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  },
  sensors: {
    color: "#84a59d",
    bg: "rgba(132, 165, 157, 0.1)",
    border: "rgba(132, 165, 157, 0.4)",
    label: "Sensor",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  },
  networking: {
    color: "#6A5A7B",
    bg: "rgba(106, 90, 123, 0.1)",
    border: "rgba(106, 90, 123, 0.4)",
    label: "Networking",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M12 8v8M5 16v-4h14v4"/></svg>`,
  },
  storage: {
    color: "#A5A5C0",
    bg: "rgba(165, 165, 192, 0.1)",
    border: "rgba(165, 165, 192, 0.4)",
    label: "Storage",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20M2 7h20M2 17h20"/></svg>`,
  },
  display: {
    color: "#e0b171",
    bg: "rgba(224, 177, 113, 0.1)",
    border: "rgba(224, 177, 113, 0.4)",
    label: "Display",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  },
  displays: {
    color: "#e0b171",
    bg: "rgba(224, 177, 113, 0.1)",
    border: "rgba(224, 177, 113, 0.4)",
    label: "Display",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  },
  power: {
    color: "#e5989b",
    bg: "rgba(229, 152, 155, 0.1)",
    border: "rgba(229, 152, 155, 0.4)",
    label: "Power",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  },
  power_supply: {
    color: "#e5989b",
    bg: "rgba(229, 152, 155, 0.1)",
    border: "rgba(229, 152, 155, 0.4)",
    label: "Power Supply",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  },
  tools: {
    color: "#8C7B9E",
    bg: "rgba(140, 123, 158, 0.1)",
    border: "rgba(140, 123, 158, 0.4)",
    label: "Tools",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 0-7.94-7.94l-6.91 6.91a2.12 2.12 0 0 0-.71 1.5v3.52a2 2 0 0 1-2 2H3.82a1 1 0 0 0-.7.3l-.9 1a1 1 0 0 0 1.41 1.41l1-1a1 1 0 0 0 .3-.7V11.5a2 2 0 0 1 2-2h3.52a2.12 2.12 0 0 0 1.5-.71l6.91-6.91a6 6 0 0 0-3.44 10.42z"/></svg>`,
  },
  other: {
    color: "#A5A5C0",
    bg: "rgba(165, 165, 192, 0.1)",
    border: "rgba(165, 165, 192, 0.4)",
    label: "Other",
    svg: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>`,
  },
};

const getStyle = (category: string) => {
  const norm = category ? category.toLowerCase().trim() : "other";
  if (norm.includes("microcontroller")) return categoryStyles.microcontrollers;
  if (norm.includes("board")) return categoryStyles.development_boards;
  if (norm.includes("sensor")) return categoryStyles.sensors;
  if (norm.includes("networking")) return categoryStyles.networking;
  if (norm.includes("storage")) return categoryStyles.storage;
  if (norm.includes("display")) return categoryStyles.displays;
  if (norm.includes("power")) return categoryStyles.power_supply;
  if (norm.includes("tool")) return categoryStyles.tools;
  return categoryStyles[norm] || categoryStyles.other;
};

// Calculate distance using Haversine formula
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // In km
};

const HardwareMap: React.FC<HardwareMapProps> = ({
  items,
  onRequestHardware,
  focusedItem,
  onClearFocusedItem,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [nearbyDistance, setNearbyDistance] = useState(3000); // Default Global (3000)
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Store requests handlers callbacks in global to let Leaflet popups access them
  useEffect(() => {
    (window as any).handleMapRequest = (id: string) => {
      const target = items.find((i) => i._id === id);
      if (target) onRequestHardware(target);
    };
    return () => {
      delete (window as any).handleMapRequest;
    };
  }, [items, onRequestHardware]);

  // Request browser geolocation on mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.warn("User geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    // First try: Check if search query matches any local listing name
    const matchItem = sidebarItems.find(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );

    if (matchItem) {
      handleCenterOnItem(matchItem);
      return;
    }

    // Second try: Geocode search query using OSM Nominatim to fly map center to that place
    setIsSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0 && mapRef.current) {
        const { lat, lon } = data[0];
        const targetLat = parseFloat(lat);
        const targetLon = parseFloat(lon);

        // Pan map center
        mapRef.current.setView([targetLat, targetLon], 11, { animate: true });
      }
    } catch (error) {
      console.error("OSM Geocoding search error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof L === "undefined") {
      console.error("Leaflet global object L is not loaded");
      return;
    }

    // Default center (India/global center if geolocation not loaded)
    const initialCenter = userLocation || [20.5937, 78.9629];
    const initialZoom = userLocation ? 12 : 5;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });
    mapRef.current = map;

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // CartoDB Positron Light Tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Create layers group
    markersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Map center when User Location updates
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current;

    // Clean up previous user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Pulsing custom marker for User
    const pulsingIcon = L.divIcon({
      className: "user-gps-marker",
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center">
          <div class="absolute w-8 h-8 bg-accent-indigo/30 rounded-full animate-ping"></div>
          <div class="absolute w-4 h-4 bg-accent-indigo rounded-full border-2 border-white shadow-glow-sm"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker(userLocation, { icon: pulsingIcon })
      .addTo(map)
      .bindPopup(
        `<div class="p-1 font-semibold text-xs text-text-primary flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-accent-indigo animate-pulse"></div>Your Location</div>`
      );

    // If map was at default center, pan to user location
    if (map.getZoom() < 8) {
      map.setView(userLocation, 12, { animate: true });
    }
  }, [userLocation]);

  // Handle focused item centering from external props
  useEffect(() => {
    if (!mapRef.current || !focusedItem) return;
    const coords = focusedItem.location?.coordinates;
    if (coords && coords.length === 2) {
      const [lng, lat] = coords;
      if (lat !== 0 || lng !== 0) {
        mapRef.current.setView([lat, lng], 15, { animate: true });

        // Find and open popup of that specific marker
        if (markersGroupRef.current) {
          markersGroupRef.current.eachLayer((layer: any) => {
            if (layer.options && layer.options.hardwareId === focusedItem._id) {
              setTimeout(() => {
                layer.openPopup();
              }, 400);
            }
          });
        }
      }
    }
    onClearFocusedItem();
  }, [focusedItem]);

  // Plot hardware markers when listings or locations change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // Plot all active hardwares with location
    items.forEach((item) => {
      const coords = item.location?.coordinates;
      if (!coords || coords.length !== 2) return;
      const [lng, lat] = coords;
      if (lat === 0 && lng === 0) return; // Skip zeroed coords

      const style = getStyle(item.category);

      // Create customized categories div marker
      const customIcon = L.divIcon({
        className: "hardware-map-pin",
        html: `
          <div class="relative group cursor-pointer flex items-center justify-center w-9 h-9 rounded-2xl shadow-glow-sm hover:shadow-glow-md border border-white hover:border-accent-indigo hover:scale-110 active:scale-95 transition-all duration-200" style="background-color: ${style.color}; color: #ffffff;">
            ${style.svg}
            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 rotate-45 border-r border-b border-white" style="background-color: ${style.color};"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const ownerName =
        typeof item.owner_id === "object"
          ? item.owner_id?.company_name || item.owner_id?.name || "Member"
          : "Member";

      const popupContent = `
        <div class="p-2 min-w-44 font-sans text-left">
          <div class="flex items-center justify-between gap-1 mb-1.5">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold text-accent-indigo border border-accent-indigo/20 capitalize" style="background-color: ${style.bg}">
              ${style.label}
            </span>
            <span class="text-[9px] font-bold uppercase ${
              item.availability_status === "available"
                ? "text-accent-emerald"
                : "text-accent-amber"
            }">
              ${item.availability_status || "Available"}
            </span>
          </div>
          <h4 class="text-sm font-bold text-text-primary mb-1 truncate leading-tight">${item.name}</h4>
          <p class="text-[10px] text-text-muted mb-2 font-medium flex items-center gap-1">
            <svg class="w-3 h-3 text-accent-indigo shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            ${item.location_name || "Tagged Location"}
          </p>
          <div class="flex items-center justify-between border-t border-border-default/50 pt-2 mt-2 gap-2">
            <div class="min-w-0">
              <span class="block text-[9px] text-text-muted leading-none">Listed by</span>
              <span class="block text-xs font-semibold text-text-secondary truncate mt-0.5">${ownerName}</span>
            </div>
            <button 
              onclick="window.handleMapRequest('${item._id}')"
              class="text-[10px] px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-violet text-white hover:scale-105 active:scale-95 transition-all duration-150 font-bold shrink-0 cursor-pointer"
            >
              Request
            </button>
          </div>
        </div>
      `;

      L.marker([lat, lng], { icon: customIcon, hardwareId: item._id })
        .addTo(markersGroup)
        .bindPopup(popupContent, {
          closeButton: false,
          className: "custom-leaflet-popup",
        });
    });
  }, [items]);

  // Handle zooming/centering onto item on click
  const handleCenterOnItem = (item: HardwareItem) => {
    const coords = item.location?.coordinates;
    if (!coords || coords.length !== 2 || !mapRef.current) return;
    const [lng, lat] = coords;
    mapRef.current.setView([lat, lng], 15, { animate: true });

    // Open popup
    if (markersGroupRef.current) {
      markersGroupRef.current.eachLayer((layer: any) => {
        if (layer.options && layer.options.hardwareId === item._id) {
          setTimeout(() => {
            layer.openPopup();
          }, 350);
        }
      });
    }
  };

  // Filter items in sidebar list by search and location proximity radius
  const sidebarItems = items
    .filter((item) => {
      // Search text filter
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.location_name &&
          item.location_name.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // Distance filter
      const coords = item.location?.coordinates;
      if (!coords || coords.length !== 2 || coords[0] === 0 || coords[1] === 0) return false;

      if (userLocation && nearbyDistance < 3000) {
        const dist = getDistance(
          userLocation[0],
          userLocation[1],
          coords[1],
          coords[0]
        );
        return dist <= nearbyDistance;
      }
      return true; // If user denied GPS or selected Global, show all matches
    })
    .map((item) => {
      // Calculate distance property
      let distanceKm = null;
      const coords = item.location?.coordinates;
      if (userLocation && coords && coords.length === 2) {
        distanceKm = getDistance(
          userLocation[0],
          userLocation[1],
          coords[1],
          coords[0]
        );
      }
      return { ...item, distance: distanceKm };
    })
    .sort((a, b) => {
      // Sort closest first if distance is available
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return 0;
    });

  return (
    <div className="relative w-full h-[650px] rounded-3xl overflow-hidden border border-border-default/60 shadow-glow-sm bg-white/70 backdrop-blur-md flex">
      {/* Interactive Map */}
      <div ref={mapContainerRef} className="flex-1 h-full z-0"></div>

      {/* Floating GPS Button */}
      <button
        onClick={detectUserLocation}
        title="Find My Location"
        className={`absolute bottom-6 left-6 z-10 p-3 rounded-2xl bg-white border border-border-default/80 shadow-md hover:shadow-lg active:scale-95 transition-all text-text-secondary hover:text-accent-indigo cursor-pointer flex items-center justify-center ${
          isLocating ? "animate-pulse text-accent-indigo" : ""
        }`}
      >
        <Compass className={`w-5 h-5 ${isLocating ? "animate-spin" : ""}`} />
      </button>

      {/* Nearby Discover sidebar */}
      <div
        className={`absolute top-0 right-0 h-full bg-white/95 backdrop-blur-lg border-l border-border-default/50 transition-all duration-300 z-10 flex flex-col ${
          isSidebarOpen ? "w-[340px]" : "w-0 overflow-hidden"
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-[48%] -left-8 p-1.5 rounded-l-xl bg-white border border-r-0 border-border-default/60 shadow-md text-text-muted hover:text-accent-indigo transition-colors cursor-pointer flex items-center justify-center"
        >
          {isSidebarOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {isSidebarOpen && (
          <div className="p-5 flex-1 flex flex-col min-h-0">
            {/* Title */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent-indigo" />
                Nearby Hardwares
              </h3>
              <p className="text-[11px] text-text-muted mt-0.5">
                Gamified radar finding shared inventory around your perimeter.
              </p>
            </div>

            {/* Radius slider */}
            {userLocation && (
              <div className="mb-4 bg-bg-primary/50 border border-border-default rounded-xl p-3 font-sans">
                <div className="flex justify-between items-center text-xs font-semibold mb-1">
                  <span className="text-text-secondary">Search Radius</span>
                  <span className="text-accent-indigo font-mono">
                    {nearbyDistance === 3000 ? "Global (Show All)" : `${nearbyDistance} km`}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="3000"
                  step="10"
                  value={nearbyDistance}
                  onChange={(e) => setNearbyDistance(Number(e.target.value))}
                  className="w-full accent-accent-indigo cursor-pointer h-1 bg-bg-tertiary rounded-lg appearance-none"
                />
              </div>
            )}

            {/* Search Bar Form */}
            <form onSubmit={handleSearchLocation} className="relative mb-4 flex gap-1.5 font-sans">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-[10px]" />
                <input
                  type="text"
                  placeholder="Search pins, cities, pin codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-bg-tertiary border border-border-default rounded-xl text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/25 transition-all h-8.5"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingLocation}
                className="px-3 py-2 text-xs bg-bg-secondary hover:bg-accent-indigo hover:text-white border border-border-default text-text-secondary rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center font-bold h-8.5"
              >
                {isSearchingLocation ? (
                  <div className="w-3.5 h-3.5 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Go"
                )}
              </button>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
              {sidebarItems.map((item) => {
                const style = getStyle(item.category);
                const ownerName =
                  typeof item.owner_id === "object"
                    ? item.owner_id?.company_name || item.owner_id?.name || "Member"
                    : "Member";

                return (
                  <div
                    key={item._id}
                    onClick={() => handleCenterOnItem(item)}
                    className="group border border-border-default/60 bg-white hover:border-accent-indigo/30 hover:bg-bg-primary/40 rounded-2xl p-3 cursor-pointer transition-all duration-200 relative flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-text-primary leading-tight truncate flex-1 group-hover:text-accent-indigo transition-colors">
                        {item.name}
                      </h4>
                      {item.distance !== null && (
                        <span className="text-[10px] font-bold text-accent-indigo font-mono bg-accent-indigo/10 border border-accent-indigo/15 px-1.5 py-0.5 rounded-md shrink-0">
                          {item.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-2 font-medium truncate">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.color }}></span>
                      <span className="capitalize">{item.category.replace(/_/g, " ")}</span>
                      <span>•</span>
                      <span>By {ownerName}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-border-default/40 pt-2 mt-1">
                      <span className="truncate flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-accent-indigo shrink-0" />
                        {item.location_name || "Unknown Location"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestHardware(item);
                        }}
                        className="text-[9px] px-2.5 py-1 rounded-md bg-bg-secondary text-accent-indigo hover:bg-accent-indigo hover:text-white transition-all font-bold cursor-pointer"
                      >
                        Request
                      </button>
                    </div>
                  </div>
                );
              })}

              {sidebarItems.length === 0 && (
                <div className="py-12 text-center flex flex-col items-center">
                  <Layers className="w-8 h-8 text-text-muted/60 mb-2" />
                  <p className="text-xs text-text-muted">No nearby listings found</p>
                  <p className="text-[10px] text-text-muted/70 mt-0.5 max-w-[200px] leading-normal">
                    Try raising the search radius slider or searching for another keyword.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slideout mini map icon button if closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-6 right-6 z-10 p-3 rounded-2xl bg-white border border-border-default/80 shadow-md hover:shadow-lg active:scale-95 transition-all text-text-secondary hover:text-accent-indigo cursor-pointer flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Pulse GPS Detection Overlay */}
      {isLocating && (
        <div className="absolute inset-0 bg-bg-primary/25 backdrop-blur-xs flex flex-col items-center justify-center z-20 animate-fade-in pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-accent-indigo/20 flex items-center justify-center animate-ping">
            <Compass className="w-8 h-8 text-accent-indigo animate-spin" />
          </div>
          <span className="text-xs font-semibold text-text-secondary mt-4 bg-white/90 border border-border-default px-3 py-1.5 rounded-full shadow-sm">
            Tuning Geolocation Radar...
          </span>
        </div>
      )}
    </div>
  );
};

export default HardwareMap;
