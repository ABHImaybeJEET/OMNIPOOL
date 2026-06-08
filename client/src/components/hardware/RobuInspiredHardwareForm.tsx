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
  });

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
      ...initialValues,
      specs: { ...initialValues.specs },
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

    const payload = {
      ...formData,
      category: catMap[formData.category] || "other",
      quantity: Math.max(1, Number(formData.quantity) || 1),
      specs: cleanSpecs,
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
