import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import type { HardwareItem } from "../store/useStore";
import {
  getHardware,
  createHardware,
  deleteHardware,
  updateHardware,
} from "../api/client";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import RobuInspiredHardwareForm from "../components/hardware/RobuInspiredHardwareForm";
import RequestPartsModal from "../components/hardware/RequestPartsModal";
import {
  Cpu,
  Tv,
  Cable,
  Settings,
  Plug,
  Wrench,
  Boxes,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  RefreshCw,
  Tag,
  Activity,
  MapPin
} from "lucide-react";
import HardwareMap from "../components/hardware/HardwareMap";

// Category to Icon mapper helper
const getCategoryIcon = (category: string) => {
  const norm = category ? category.toLowerCase().trim() : '';
  if (norm.includes('microcontroller') || norm.includes('board')) return <Cpu className="w-3.5 h-3.5" />;
  if (norm.includes('sensor')) return <Activity className="w-3.5 h-3.5" />;
  if (norm.includes('display')) return <Tv className="w-3.5 h-3.5" />;
  if (norm.includes('cable') || norm.includes('connector')) return <Cable className="w-3.5 h-3.5" />;
  if (norm.includes('power')) return <Plug className="w-3.5 h-3.5" />;
  if (norm.includes('tool')) return <Wrench className="w-3.5 h-3.5" />;
  if (norm.includes('passive') || norm.includes('active') || norm.includes('ic')) return <Layers className="w-3.5 h-3.5" />;
  if (norm.includes('actuator')) return <Settings className="w-3.5 h-3.5" />;
  return <Boxes className="w-3.5 h-3.5" />;
};

// --- SHARED DATA ---

// Remove DUMMY_RESOURCES, we will use real hardware data

const RegistryPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"my_hardware" | "community" | "hardware_map">(
    "community",
  );

  const [focusedMapItem, setFocusedMapItem] = useState<HardwareItem | null>(null);

  const handleViewLocation = (item: HardwareItem) => {
    setFocusedMapItem(item);
    setActiveTab("hardware_map");
  };

  const { myHardware, setMyHardware, user } = useStore();
  const isEnterpriseApproved =
    user?.account_type === "enterprise" &&
    user?.enterprise_status === "accepted";

  // Community Resources State
  const [filter, setFilter] = useState<"all" | "community" | "enterprise">(
    "all",
  );
  const [communityHardware, setCommunityHardware] = useState<HardwareItem[]>(
    [],
  );
  const filteredResources = communityHardware.filter(
    (r: HardwareItem) => filter === "all" || r.owner_type === filter,
  );

  // My Hardware State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingHardware, setEditingHardware] = useState<HardwareItem | null>(
    null,
  );
  const [selectedHardware, setSelectedHardware] = useState<HardwareItem | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sub-tabs for My Inventory
  const [myInventoryTab, setMyInventoryTab] = useState<
    "community" | "enterprise"
  >("community");

  const getOwnerDisplayName = (item: HardwareItem) => {
    if (
      item.owner_type === "enterprise" &&
      item.owner_id &&
      typeof item.owner_id === "object"
    ) {
      return item.owner_id.company_name || item.owner_id.name || "Enterprise";
    }

    if (item.owner_id && typeof item.owner_id === "object") {
      return item.owner_id.name || "Unknown User";
    }

    return "Unknown User";
  };

  const getSpecEntries = (specs: HardwareItem["specs"]) => {
    if (!specs) return [];

    if (specs instanceof Map) {
      return Array.from(specs.entries()).filter(([, value]) =>
        Boolean(String(value).trim()),
      );
    }

    return Object.entries(specs as Record<string, string>).filter(([, value]) =>
      Boolean(String(value).trim()),
    );
  };

  const getSortedSpecEntries = (specs: HardwareItem["specs"]) => {
    const priorityKeys = [
      "type",
      "model",
      "part number",
      "resistance",
      "voltage",
      "current",
      "power",
      "clock speed",
      "flash memory",
      "sram",
    ];

    const getPriority = (key: string) => {
      const normalized = key.toLowerCase().trim();
      const index = priorityKeys.indexOf(normalized);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return [...getSpecEntries(specs)].sort((a, b) => {
      const priorityA = getPriority(a[0]);
      const priorityB = getPriority(b[0]);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a[0].localeCompare(b[0]);
    });
  };

  const categoryFromApiToForm: Record<string, string> = {
    microcontrollers: "Microcontrollers",
    development_boards: "Development Boards",
    sensors: "Sensors",
    actuators: "Actuators",
    passive_components: "Passive Components",
    active_ics: "Active ICs",
    displays: "Displays",
    cables_connectors: "Cables & Connectors",
    power_supply: "Power Supply",
    tools: "Tools",
    other: "Other",
  };

  const categoryFromFormToApi: Record<string, string> = {
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

  const normalizeSpecsForForm = (specs: HardwareItem["specs"]) => {
    if (!specs) return {};
    if (specs instanceof Map) return Object.fromEntries(specs.entries());
    return { ...(specs as Record<string, string>) };
  };

  const getFormInitialValues = (item: HardwareItem | null) => {
    if (!item) return undefined;

    const formCategory = categoryFromApiToForm[item.category] || "Other";

    return {
      name: item.name || "",
      brand: item.brand || "",
      category: formCategory,
      sub_category: item.sub_category || "Others",
      condition: (item.condition || "new") as "new" | "used" | "refurbished",
      quantity: String(item.quantity || 1),
      owner_type: (item.owner_type || "community") as
        | "community"
        | "enterprise",
      description: item.description || "",
      image_url: item.image_url || "",
      specs: normalizeSpecsForForm(item.specs),
      location: item.location,
      location_name: item.location_name,
    };
  };

  useEffect(() => {
    fetchHardware();
  }, []);

  useEffect(() => {
    if (!isEnterpriseApproved && myInventoryTab === "enterprise") {
      setMyInventoryTab("community");
    }
  }, [isEnterpriseApproved, myInventoryTab]);

  const fetchHardware = async () => {
    try {
      const { data } = await getHardware();
      // Split into my hardware vs community hardware
      if (user) {
        const mine = data.data.filter(
          (item: HardwareItem) =>
            (item.owner_id &&
            typeof item.owner_id === "object" &&
            "_id" in item.owner_id
              ? item.owner_id._id
              : item.owner_id) === user._id,
        );
        const others = data.data.filter(
          (item: HardwareItem) =>
            (item.owner_id &&
            typeof item.owner_id === "object" &&
            "_id" in item.owner_id
              ? item.owner_id._id
              : item.owner_id) !== user._id &&
            item.availability_status === "available",
        );
        setMyHardware(mine);
        setCommunityHardware(others);
      } else {
        setCommunityHardware(
          data.data.filter(
            (i: HardwareItem) => i.availability_status === "available",
          ),
        );
      }
    } catch (error) {
      console.error("Failed to fetch hardware:", error);
    }
  };

  const handleSubmit = async (payload: any) => {
    setIsLoading(true);
    try {
      const safeOwnerType =
        isEnterpriseApproved && payload.owner_type === "enterprise"
          ? "enterprise"
          : "community";

      const normalizedPayload = {
        ...payload,
        category: categoryFromFormToApi[payload.category] || payload.category,
        owner_type: safeOwnerType,
      };

      if (editingHardware) {
        await updateHardware(editingHardware._id, normalizedPayload);
      } else {
        await createHardware(normalizedPayload);
      }

      await fetchHardware();
      setEditingHardware(null);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Failed to save hardware:", error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.messages?.[0] ||
          "Failed to save hardware.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (item: HardwareItem) => {
    setEditingHardware(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHardware(id);
      await fetchHardware();
    } catch (error) {
      console.error("Failed to delete hardware:", error);
    }
  };

  const handleToggleAvailability = async (item: HardwareItem) => {
    const nextStatus =
      item.availability_status === "available" ? "in-use" : "available";
    try {
      await updateHardware(item._id, { availability_status: nextStatus });
      await fetchHardware();
    } catch (error) {
      console.error("Failed to update availability:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 animate-fade-in">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Hardware <span className="gradient-text">Registry</span>
            </h1>
            <p className="text-text-secondary">
              Discover community components or manage your own electronics
              sharing portfolio.
            </p>
          </div>
          <div className="flex bg-bg-secondary border border-border-default rounded-xl p-1 shrink-0 gap-1">
            <button
              onClick={() => setActiveTab("community")}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "community"
                  ? "bg-bg-card shadow-sm text-text-primary border border-border-default"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Hardware Network
            </button>
            <button
              onClick={() => setActiveTab("hardware_map")}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "hardware_map"
                  ? "bg-bg-card shadow-sm text-text-primary border border-border-default"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Radar Map
            </button>
            <button
              onClick={() => setActiveTab("my_hardware")}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "my_hardware"
                  ? "bg-bg-card shadow-sm text-text-primary border border-border-default"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              My Inventory
            </button>
          </div>
        </div>

        {/* --- VIEW: COMMUNITY RESOURCES --- */}
        {activeTab === "community" && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="space-y-2">
                <div className="flex bg-bg-secondary/50 p-1 rounded-lg border border-border-default">
                  {(["all", "community", "enterprise"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === f
                          ? "bg-bg-glass text-text-primary border border-border-default"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted max-w-xl">
                  This section is your browse-and-request console. Use it to
                  inspect the network supply without touching your own
                  inventory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((item: HardwareItem) => {
                const specEntries = getSortedSpecEntries(item.specs);
                const visibleSpecs = specEntries.slice(0, 6);

                return (
                  <Card
                    key={item._id}
                    className="group relative flex flex-col h-full overflow-hidden rounded-[1.75rem] border border-border-default/60 bg-white/75 backdrop-blur-md p-6 hover:shadow-glow-md hover:border-accent-indigo/40 hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {/* Row 1: Primary Category + Status */}
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20 text-[11px] font-bold">
                        {getCategoryIcon(item.category)}
                        <span className="capitalize">{categoryFromApiToForm[item.category] || item.category.replace(/_/g, ' ')}</span>
                      </span>

                      {/* Status Indicator Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                        item.availability_status === 'available' || !item.availability_status
                          ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                          : 'bg-accent-rose/10 text-accent-rose border-accent-rose/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.availability_status === 'available' || !item.availability_status
                            ? 'bg-accent-emerald animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                            : 'bg-accent-rose'
                        }`} />
                        <span className="uppercase">{item.availability_status || 'Available'}</span>
                      </span>
                    </div>

                    {/* Row 2: Brand & Condition Badges */}
                    {(item.brand || item.condition) && (
                      <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-bold">
                        {item.brand && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg-secondary text-text-secondary border border-border-default/60 font-medium">
                            <Tag className="w-3 h-3 text-text-muted" />
                            <span>{item.brand}</span>
                          </span>
                        )}
                        {item.condition && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                            item.condition === 'new'
                              ? 'bg-accent-emerald/5 text-accent-emerald border-accent-emerald/15'
                              : 'bg-accent-amber/5 text-accent-amber border-accent-amber/15'
                          }`}>
                            {item.condition}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Title and Qty */}
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <h3 className="text-lg font-bold text-text-primary leading-tight group-hover:text-accent-indigo transition-colors duration-200">
                        {item.name}
                      </h3>
                      <span className="inline-flex items-center text-[11px] font-mono font-bold bg-bg-tertiary border border-border-default px-2.5 py-0.5 rounded-lg text-text-secondary shrink-0">
                        Qty: {item.quantity || 1}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted capitalize mb-3">
                      {item.category.replace(/_/g, " ")}
                      {item.sub_category ? ` • ${item.sub_category}` : ""}
                    </p>

                    {item.description ? (
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-4">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-sm text-text-muted/60 italic mb-4">
                        No description provided.
                      </p>
                    )}

                    {/* Specs / Info Box */}
                    {specEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {visibleSpecs.map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-border-default/60 text-[10px] text-text-secondary hover:border-accent-indigo/30 transition-colors"
                          >
                            <span className="text-text-muted uppercase tracking-wider text-[9px] font-bold">{key}:</span>
                            <span className="font-bold text-text-primary">{value}</span>
                          </span>
                        ))}
                        {specEntries.length > 6 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bg-secondary border border-border-default text-[10px] text-text-muted font-bold">
                            +{specEntries.length - 6} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mb-4 text-[11px] text-text-muted/80 bg-bg-primary/50 border border-border-default rounded-xl px-3 py-2.5 flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-accent-indigo/60 shrink-0" />
                        <span>Standard hardware configuration</span>
                      </div>
                    )}

                    {/* Location Pin */}
                    {item.location_name && (
                      <button
                        onClick={() => handleViewLocation(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 text-xs font-semibold rounded-xl bg-bg-secondary hover:bg-accent-indigo/10 active:scale-95 transition-all text-text-secondary hover:text-accent-indigo border border-border-default/50 w-fit cursor-pointer leading-none"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-accent-indigo" />
                        <span className="truncate max-w-[200px]">{item.location_name}</span>
                      </button>
                    )}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-border-default/50 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                            item.owner_type === "enterprise"
                              ? "from-accent-indigo to-accent-violet"
                              : "from-accent-emerald to-accent-cyan"
                          } flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/20 shrink-0`}
                        >
                          {getOwnerDisplayName(item).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-text-secondary truncate leading-tight">
                            {getOwnerDisplayName(item)}
                          </span>
                          <span className="block text-[10px] text-text-muted leading-tight mt-0.5">
                            {item.owner_type === "enterprise" ? "Enterprise listing" : "Community listing"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedHardware(item);
                          setIsRequestModalOpen(true);
                        }}
                        className="text-xs px-4.5 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet text-white hover:shadow-glow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-bold shrink-0 cursor-pointer"
                      >
                        Request
                      </button>
                    </div>
                  </Card>
                );
              })}

              {filteredResources.length === 0 && (
                <div className="col-span-full py-12 text-center text-text-muted">
                  No hardware items found matching the selected filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: MY HARDWARE --- */}
        {activeTab === "my_hardware" && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setMyInventoryTab("community")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${myInventoryTab === "community" ? "bg-accent-emerald/10 text-accent-emerald" : "bg-bg-secondary text-text-muted hover:text-text-primary"}`}
                >
                  Personal / Community
                </button>
                {isEnterpriseApproved && (
                  <button
                    onClick={() => setMyInventoryTab("enterprise")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${myInventoryTab === "enterprise" ? "bg-accent-indigo/10 text-accent-indigo" : "bg-bg-secondary text-text-muted hover:text-text-primary"}`}
                  >
                    Enterprise Items
                  </button>
                )}
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setEditingHardware(null);
                  setIsFormOpen(true);
                }}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Hardware
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myHardware
                .filter(
                  (h: HardwareItem) =>
                    (h.owner_type || "community") === myInventoryTab,
                )
                .map((item: HardwareItem) => {
                  const specEntries = getSortedSpecEntries(item.specs);
                  const visibleSpecs = specEntries.slice(0, 6);

                  return (                    <Card
                      key={item._id}
                      className="group relative flex flex-col h-full overflow-hidden rounded-[1.75rem] border border-border-default/60 bg-white/75 backdrop-blur-md p-6 hover:shadow-glow-md hover:border-accent-indigo/40 hover:-translate-y-1.5 transition-all duration-300"
                    >
                      {/* Row 1: Primary Category + Status */}
                      <div className="flex items-center justify-between gap-3 mb-2.5 pr-24">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20 text-[11px] font-bold">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize">{categoryFromApiToForm[item.category] || item.category.replace(/_/g, ' ')}</span>
                        </span>

                        {/* Status Indicator Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border ${
                          item.availability_status === 'available' || !item.availability_status
                            ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                            : item.availability_status === 'in-use'
                              ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                              : 'bg-accent-rose/10 text-accent-rose border-accent-rose/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.availability_status === 'available' || !item.availability_status
                              ? 'bg-accent-emerald animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                              : item.availability_status === 'in-use'
                                ? 'bg-accent-amber'
                                : 'bg-accent-rose'
                          }`} />
                          <span className="uppercase">
                            {item.availability_status === 'available' ? 'Available' : item.availability_status === 'in-use' ? 'In Use' : item.availability_status || 'Available'}
                          </span>
                        </span>
                      </div>

                      {/* Row 2: Brand & Condition Badges */}
                      {(item.brand || item.condition) && (
                        <div className="flex flex-wrap gap-1.5 mb-4 text-[10px] font-bold">
                          {item.brand && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-bg-secondary text-text-secondary border border-border-default/60 font-medium">
                              <Tag className="w-3 h-3 text-text-muted" />
                              <span>{item.brand}</span>
                            </span>
                          )}
                          {item.condition && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                              item.condition === 'new'
                                ? 'bg-accent-emerald/5 text-accent-emerald border-accent-emerald/15'
                                : 'bg-accent-amber/5 text-accent-amber border-accent-amber/15'
                            }`}>
                              {item.condition}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Card Action Controls (absolute in top right on hover) */}
                      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 z-10">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-full bg-white/90 hover:bg-accent-emerald hover:text-white text-text-muted border border-border-default shadow-sm hover:shadow transition-all cursor-pointer"
                          title="Edit hardware"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className="p-2 rounded-full bg-white/90 hover:bg-accent-indigo hover:text-white text-text-muted border border-border-default shadow-sm hover:shadow transition-all cursor-pointer"
                          title="Toggle availability"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-full bg-white/90 hover:bg-accent-rose hover:text-white text-text-muted border border-border-default shadow-sm hover:shadow transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Title and Qty */}
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <h3 className="text-lg font-bold text-text-primary leading-tight group-hover:text-accent-indigo transition-colors duration-200">
                          {item.name}
                        </h3>
                        <span className="inline-flex items-center text-[11px] font-mono font-bold bg-bg-tertiary border border-border-default px-2.5 py-0.5 rounded-lg text-text-secondary shrink-0">
                          Qty: {item.quantity || 1}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted capitalize mb-3">
                        {item.category.replace(/_/g, " ")}
                        {item.sub_category ? ` • ${item.sub_category}` : ""}
                      </p>

                      {item.description ? (
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 mb-4">
                          {item.description}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted/60 italic mb-4">
                          No description provided.
                        </p>
                      )}

                      {/* Specs / Info Box */}
                      {specEntries.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {visibleSpecs.map(([key, val]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-border-default/60 text-[10px] text-text-secondary hover:border-accent-indigo/30 transition-colors"
                            >
                              <span className="text-text-muted uppercase tracking-wider text-[9px] font-bold">{key}:</span>
                              <span className="font-bold text-text-primary">{val}</span>
                            </span>
                          ))}
                          {specEntries.length > 6 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-bg-secondary border border-border-default text-[10px] text-text-muted font-bold">
                              +{specEntries.length - 6} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 text-xs text-accent-indigo bg-accent-indigo/5 border border-dashed border-accent-indigo/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>Add technical specs to make this listing more useful.</span>
                        </div>
                      )}

                      {/* Location Pin */}
                      {item.location_name && (
                        <button
                          onClick={() => handleViewLocation(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 text-xs font-semibold rounded-xl bg-bg-secondary hover:bg-accent-indigo/10 active:scale-95 transition-all text-text-secondary hover:text-accent-indigo border border-border-default/50 w-fit cursor-pointer leading-none"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-accent-indigo" />
                          <span className="truncate max-w-[200px]">{item.location_name}</span>
                        </button>
                      )}

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-border-default/50 flex justify-between items-center gap-3">
                        <div className="text-xs text-text-muted">
                          {item.owner_type === "enterprise"
                            ? item.owner_id &&
                              typeof item.owner_id === "object" &&
                              "company_name" in item.owner_id &&
                              item.owner_id.company_name
                              ? `Enterprise: ${item.owner_id.company_name}`
                              : "Enterprise listing"
                            : "Community listing"}
                        </div>
                      </div>
                    </Card>
                  );
                })}

              {myHardware.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-bg-tertiary border border-border-default flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-secondary mb-2">
                    No hardware registered
                  </h3>
                  <p className="text-sm text-text-muted mb-4">
                    Share your first item with the community
                  </p>
                  <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                    Add Hardware
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: HARDWARE MAP --- */}
        {activeTab === "hardware_map" && (
          <div className="animate-fade-in-up">
            <HardwareMap
              items={communityHardware.concat(myHardware)}
              onRequestHardware={(item) => {
                setSelectedHardware(item);
                setIsRequestModalOpen(true);
              }}
              focusedItem={focusedMapItem}
              onClearFocusedItem={() => setFocusedMapItem(null)}
            />
          </div>
        )}
      </div>

      {/* --- ADD HARDWARE MODAL --- */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHardware(null);
        }}
        title={editingHardware ? "Edit Hardware" : "Register Hardware"}
        size="lg"
      >
        <RobuInspiredHardwareForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingHardware(null);
          }}
          isLoading={isLoading}
          initialValues={getFormInitialValues(editingHardware)}
          submitLabel={editingHardware ? "Save Changes" : "Submit Hardware"}
        />
      </Modal>

      {/* --- REQUEST PARTS MODAL --- */}
      <RequestPartsModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedHardware(null);
        }}
        selectedItem={selectedHardware}
        onSuccess={(request) => {
          navigate(`/chat?request_id=${request._id}`);
        }}
      />
    </div>
  );
};

export default RegistryPage;
