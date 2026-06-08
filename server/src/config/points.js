const CATEGORY_WEIGHTS = {
  microcontrollers: 3,
  development_boards: 3,
  active_ics: 3,
  sensors: 2,
  actuators: 2,
  displays: 2,
  power_supply: 2,
  tools: 2,
  passive_components: 1,
  cables_connectors: 1,
  compute: 2,
  sensor: 2,
  networking: 2,
  storage: 2,
  display: 2,
  power: 2,
  other: 1,
};

const CONDITION_MULTIPLIERS = {
  new: 1,
  refurbished: 0.85,
  used: 0.7,
};

const POINTS_RULES = {
  basePoints: 10,
  defaultCategoryWeight: 1,
  defaultConditionMultiplier: 1,
};

module.exports = {
  CATEGORY_WEIGHTS,
  CONDITION_MULTIPLIERS,
  POINTS_RULES,
};
