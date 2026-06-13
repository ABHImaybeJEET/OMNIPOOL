import React, { useEffect, useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import useStore from "../../store/useStore";

// Robu.in inspired categories tree
const CATEGORY_TREE = {
  Microcontrollers: [
    "Arduino",
    "ESP32/ESP8266",
    "Raspberry Pi",
    "STM32",
    "Others",
  ],
  "Development Boards": ["FPGA", "Single Board Computers", "Evaluation Kits"],
  Sensors: [
    "Temperature/Humidity",
    "Motion/Position",
    "Gas/Air Quality",
    "Light/Color",
    "Biometric",
    "Current/Voltage",
    "Others",
  ],
  Actuators: [
    "Stepper Motors",
    "Servo Motors",
    "DC Motors",
    "Solenoids",
    "Relays",
  ],
  "Passive Components": [
    "Resistors",
    "Capacitors",
    "Inductors",
    "Potentiometers",
  ],
  "Active ICs": [
    "Op-Amps",
    "Logic Gates",
    "Timers",
    "Drivers",
    "Power Management",
  ],
  Displays: ["OLED", "LCD", "TFT/Touch", "E-Paper", "Segmented"],
  "Cables & Connectors": [
    "Jumper Wires",
    "Header Pins",
    "Terminal Blocks",
    "USB Cables",
    "RF Connectors",
  ],
  "Power Supply": [
    "Batteries",
    "Battery Holders",
    "Boost/Buck Converters",
    "Wall Adapters",
  ],
  Tools: ["Soldering", "Measurement", "Hand Tools", "Prototyping Boards"],
  Other: ["Miscellaneous"],
};

// Smart defaults for specifications based on category
const SPEC_DEFAULTS: Record<string, string[]> = {
  Microcontrollers: [
    "Clock Speed",
    "Flash Memory",
    "SRAM",
    "Operating Voltage",
    "I/O Pins",
  ],
  Motors: [
    "Operating Voltage",
    "Stall Torque",
    "No Load Speed",
    "Current Rating",
  ],
  Sensors: [
    "Operating Voltage",
    "Interface (I2C/SPI/Analog)",
    "Range",
    "Accuracy",
  ],
  Displays: ["Resolution", "Interface", "Driver IC", "Diagonal Size"],
  "Power Supply": [
    "Input Voltage",
    "Output Voltage",
    "Max Current",
    "Efficiency",
  ],
};

interface RobuInspiredHardwareFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  initialValues?: {
    name: string;
    brand: string;
    category: string;
    sub_category: string;
    condition: "new" | "used" | "refurbished";
    quantity: string;
    owner_type: "community" | "enterprise";
    description: string;
    image_url: string;
    specs: Record<string, string>;
    location?: {
      type: string;
      coordinates: [number, number];
    };
    location_name?: string;
  };
  submitLabel?: string;
}

const RobuInspiredHardwareForm: React.FC<RobuInspiredHardwareFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
  initialValues,
  submitLabel = "Submit Hardware",
}) => {
  const user = useStore((state) => state.user);
  const isEnterpriseApproved =
    user?.account_type === "enterprise" &&
    user?.enterprise_status === "accepted";

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Microcontrollers",
    sub_category: "Arduino",
    condition: "new",
    quantity: "1",
    owner_type: (isEnterpriseApproved ? "enterprise" : "community") as
      | "community"
      | "enterprise",
    description: "",
    image_url: "",
    specs: {} as Record<string, string>,
    latitude: "",
    longitude: "",
    location_name: "",
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationError, setLocationError] = useState("");

  const handleGeocodeAddress = async () => {
    const query = formData.location_name.trim();
    if (!query) {
      setLocationError("Please enter a location name or address first.");
      return;
    }

    setIsGeocoding(true);
    setLocationError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));
      } else {
        setLocationError("Could not resolve coordinates. Try adding city or pin code.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setLocationError("Failed to fetch coordinates. Please enter manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(
          error.code === 1
            ? "Permission denied. Please allow location access."
            : "Unable to retrieve location."
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  const parseSpecDraft = (rawKeyInput: string, rawValueInput: string) => {
    const rawKey = rawKeyInput.trim();
    const rawValue = rawValueInput.trim();
    if (!rawKey) return null;

    let parsedKey = rawKey;
    let parsedValue = rawValue;

    // Support single-line input like "Type UNO" or "Type: UNO".
    if (!parsedValue) {
      const colonOrEquals = rawKey.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (colonOrEquals) {
        parsedKey = colonOrEquals[1].trim();
        parsedValue = colonOrEquals[2].trim();
      } else {
        const parts = rawKey.split(/\s+/);
        if (parts.length > 1) {
          parsedKey = parts[0].trim();
          parsedValue = parts.slice(1).join(" ").trim();
        }
      }
    }

    if (!parsedKey || !parsedValue) return null;
    return { key: parsedKey, value: parsedValue };
  };

  useEffect(() => {
    if (!isEnterpriseApproved && formData.owner_type === "enterprise") {
      setFormData((prev) => ({ ...prev, owner_type: "community" }));
    }
  }, [isEnterpriseApproved, formData.owner_type]);

  useEffect(() => {
    if (!initialValues) return;

    setFormData({
      name: initialValues.name || "",
      brand: initialValues.brand || "",
      category: initialValues.category || "Microcontrollers",
      sub_category: initialValues.sub_category || "Arduino",
      condition: initialValues.condition || "new",
      quantity: String(initialValues.quantity || "1"),
      owner_type: initialValues.owner_type || "community",
      description: initialValues.description || "",
      image_url: initialValues.image_url || "",
      specs: { ...(initialValues.specs || {}) },
      latitude: initialValues.location?.coordinates?.[1] !== undefined ? String(initialValues.location.coordinates[1]) : "",
      longitude: initialValues.location?.coordinates?.[0] !== undefined ? String(initialValues.location.coordinates[0]) : "",
      location_name: initialValues.location_name || "",
    });
    setSpecKey("");
    setSpecValue("");
  }, [initialValues]);

  // Handle category change to update sub-category to first item in new category
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const firstSubCat =
      CATEGORY_TREE[newCategory as keyof typeof CATEGORY_TREE][0] || "";
    setFormData({
      ...formData,
      category: newCategory,
      sub_category: firstSubCat,
      specs: {}, // Reset specs on category change
    });
  };

  // Pre-populate smart specs based on category
  const handlePopulateSmartSpecs = () => {
    let defaults: string[] = [];
    if (
      ["Microcontrollers", "Development Boards"].includes(formData.category)
    ) {
      defaults = SPEC_DEFAULTS["Microcontrollers"];
    } else if (formData.category === "Actuators") {
      defaults = SPEC_DEFAULTS["Motors"];
    } else if (formData.category === "Sensors") {
      defaults = SPEC_DEFAULTS["Sensors"];
    } else if (formData.category === "Displays") {
      defaults = SPEC_DEFAULTS["Displays"];
    } else if (formData.category === "Power Supply") {
      defaults = SPEC_DEFAULTS["Power Supply"];
    }

    if (defaults.length > 0) {
      const newSpecs = { ...formData.specs };
      defaults.forEach((key) => {
        if (!newSpecs[key]) newSpecs[key] = ""; // Add empty value if not exists
      });
      setFormData({ ...formData, specs: newSpecs });
    }
  };

  const handleAddSpec = () => {
    const parsedSpec = parseSpecDraft(specKey, specValue);
    if (!parsedSpec) return;

    setFormData({
      ...formData,
      specs: { ...formData.specs, [parsedSpec.key]: parsedSpec.value },
    });
    setSpecKey("");
    setSpecValue("");
  };

  const handleUpdateSpec = (key: string, val: string) => {
    setFormData({
      ...formData,
      specs: { ...formData.specs, [key]: val },
    });
  };

  const handleRemoveSpec = (key: string) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData({ ...formData, specs: newSpecs });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specsToSubmit = { ...formData.specs };
    const pendingSpec = parseSpecDraft(specKey, specValue);
    if (pendingSpec) {
      specsToSubmit[pendingSpec.key] = pendingSpec.value;
    }

    // Filter out empty specs
    const cleanSpecs: Record<string, string> = {};
    Object.entries(specsToSubmit).forEach(([k, v]) => {
      if (v && v.trim()) cleanSpecs[k] = v.trim();
    });

    // Exact mapping to Mongoose enum
    const catMap: Record<string, string> = {
      Microcontrollers: "microcontrollers",
      "Development Boards": "development_boards",
      Sensors: "sensors",
      Actuators: "actuators",
      "Passive Components": "passive_components",
      "Active ICs": "active_ics",
      Displays: "displays",
      "Cables & Connectors": "cables_connectors",
      "Power Supply": "power_supply",
      Tools: "tools",
      Other: "other",
    };

    const latNum = parseFloat(formData.latitude);
    const lngNum = parseFloat(formData.longitude);
    const hasCoords = !isNaN(latNum) && !isNaN(lngNum);

    if (formData.location_name.trim() && !hasCoords) {
      setLocationError("Coordinates must be resolved before submitting. Click 'Locate Coordinates' or 'Auto-Detect My Location' first.");
      return;
    }

    const payload = {
      name: formData.name,
      brand: formData.brand,
      category: catMap[formData.category] || "other",
      sub_category: formData.sub_category,
      condition: formData.condition,
      quantity: Math.max(1, Number(formData.quantity) || 1),
      owner_type: formData.owner_type,
      description: formData.description,
      image_url: formData.image_url,
      specs: cleanSpecs,
      location: hasCoords
        ? {
            type: "Point",
            coordinates: [lngNum, latNum], // [longitude, latitude] for GeoJSON
          }
        : undefined,
      location_name: formData.location_name.trim(),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="md:col-span-2">
          <Input
            label="Hardware Name / Model"
            placeholder="e.g. NodeMCU ESP8266 CP2102"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Brand */}
        <Input
          label="Brand / Manufacturer"
          placeholder="e.g. Espressif, SparkFun (Optional)"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        />

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Condition
          </label>
          <div className="flex gap-4">
            {["new", "used", "refurbished"].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={c}
                  checked={formData.condition === c}
                  onChange={() => setFormData({ ...formData, condition: c })}
                  className="text-accent-indigo focus:ring-accent-indigo"
                />
                <span className="text-sm capitalize">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Category
          </label>
          <select
            value={formData.category}
            onChange={handleCategoryChange}
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all"
          >
            {Object.keys(CATEGORY_TREE).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Sub-Category
          </label>
          <select
            value={formData.sub_category}
            onChange={(e) =>
              setFormData({ ...formData, sub_category: e.target.value })
            }
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all"
          >
            {CATEGORY_TREE[formData.category as keyof typeof CATEGORY_TREE].map(
              (sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ),
            )}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <Input
            label="Quantity Available"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: e.target.value,
              })
            }
            required
          />
        </div>

        {/* Listing Type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Listing Type
          </label>
          <select
            value={formData.owner_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                owner_type: e.target.value as "community" | "enterprise",
              })
            }
            className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all"
          >
            <option value="community">Personal / Community</option>
            {isEnterpriseApproved && (
              <option value="enterprise">Company / Enterprise</option>
            )}
          </select>
          {!isEnterpriseApproved && (
            <p className="text-xs text-text-muted mt-1">
              Enterprise listing unlocks after enterprise application approval.
            </p>
          )}
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4 space-y-3">
        <label className="block text-sm font-bold text-text-primary">
          Location Details
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1.5 font-sans">
              Location Name / Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. NIT Rourkela, Odisha or 769008"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                className="flex-1 bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all font-sans text-sm"
                required
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleGeocodeAddress}
                isLoading={isGeocoding}
                className="px-4 py-2.5 h-auto text-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Locate Coordinates
              </Button>
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              Enter a landmark name, pin code, or address and click "Locate Coordinates" to auto-resolve coordinates.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5 font-sans">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 32.7767"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all font-mono text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5 font-sans">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. -96.7970"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDetectLocation}
            className="flex items-center justify-center gap-1.5 h-auto py-2 px-3 text-xs w-full sm:w-auto cursor-pointer"
            isLoading={isLocating}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Auto-Detect My Location
          </Button>

          {locationError && (
            <span className="text-xs text-accent-rose font-medium mt-1 sm:mt-0 animate-fade-in">
              {locationError}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Description (Features & Details)
        </label>
        <textarea
          placeholder="Describe the hardware, known issues, exact model numbers..."
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full min-h-25 bg-bg-tertiary border border-border-default rounded-xl px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-indigo focus:ring-1 focus:ring-accent-indigo/30 transition-all resize-y"
          required
        />
      </div>

      {/* Specifications */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-bold text-text-primary">
            Specifications
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePopulateSmartSpecs}
            className="text-xs py-1 h-auto text-accent-indigo"
          >
            + Smart Defaults
          </Button>
        </div>

        {Object.entries(formData.specs).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(formData.specs).map(([key, val]) => (
              <div key={key} className="flex gap-2 items-center">
                <span className="text-sm text-text-secondary w-24 sm:w-32 md:w-40 shrink-0 truncate bg-bg-tertiary px-3 py-2 rounded-lg border border-border-default">
                  {key}
                </span>
                <input
                  type="text"
                  placeholder="Value..."
                  value={val}
                  onChange={(e) => handleUpdateSpec(key, e.target.value)}
                  className="flex-1 min-w-0 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-indigo"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(key)}
                  className="p-2 text-text-muted hover:text-accent-rose transition-colors shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Spec key or 'Type: UNO'"
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddSpec())
            }
            className="w-full sm:w-1/3 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-indigo"
          />
          <div className="flex gap-2 flex-1">
            <input
              placeholder="Value"
              value={specValue}
              onChange={(e) => setSpecValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddSpec())
              }
              className="flex-1 min-w-0 bg-bg-tertiary border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-indigo"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSpec}
              className="px-4 py-2 h-auto text-sm shrink-0"
            >
              Add
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Tip: You can type "Type UNO" or "Type: UNO" in one field. Any pending
          spec will also be included when you submit.
        </p>
      </div>

      <Input
        label="Image URL (Optional)"
        placeholder="https://..."
        value={formData.image_url}
        onChange={(e) =>
          setFormData({ ...formData, image_url: e.target.value })
        }
      />

      <div className="flex gap-3 pt-4 border-t border-border-default">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1 flex justify-center items-center gap-2"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default RobuInspiredHardwareForm;
