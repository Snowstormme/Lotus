const COSTS_AZN = {
  transportPerTrip: 0.5, // placeholder estimate, verify before the demo
  printingPerPage: 0.2, // placeholder estimate, verify before the demo
  coffeePerCup: 2.5, // placeholder estimate, verify before the demo
  studyMaterialsMonthly: 25 // placeholder estimate, verify before the demo
};

const WEEKS_PER_MONTH = 4.33;

const INPUT_RULES = {
  study_days_per_week: { min: 0, max: 7, default: 3 },
  printed_pages_per_month: { min: 0, max: 500, default: 40 },
  campus_trips_per_week: { min: 0, max: 14, default: 6 },
  coffees_per_week: { min: 0, max: 14, default: 3 }
};

function validateInputs(input) {
  const values = {};
  for (const [name, rule] of Object.entries(INPUT_RULES)) {
    const value = input[name] === undefined ? rule.default : Number(input[name]);
    if (!Number.isInteger(value) || value < rule.min || value > rule.max) {
      return { valid: false, message: name + ' must be an integer from ' + rule.min + ' to ' + rule.max + '.' };
    }
    values[name] = value;
  }
  return { valid: true, values };
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function estimateMonthlyCost(input = {}) {
  const validation = validateInputs(input);
  if (!validation.valid) return validation;

  const values = validation.values;
  const breakdown = [
    {
      label: 'Transport',
      quantity: roundCurrency(values.campus_trips_per_week * WEEKS_PER_MONTH),
      amount_azn: roundCurrency(values.campus_trips_per_week * WEEKS_PER_MONTH * COSTS_AZN.transportPerTrip)
    },
    {
      label: 'Printing',
      quantity: values.printed_pages_per_month,
      amount_azn: roundCurrency(values.printed_pages_per_month * COSTS_AZN.printingPerPage)
    },
    {
      label: 'Coffee',
      quantity: roundCurrency(values.coffees_per_week * WEEKS_PER_MONTH),
      amount_azn: roundCurrency(values.coffees_per_week * WEEKS_PER_MONTH * COSTS_AZN.coffeePerCup)
    },
    {
      label: 'Study materials',
      quantity: 1,
      amount_azn: COSTS_AZN.studyMaterialsMonthly
    }
  ];

  return {
    valid: true,
    total_azn: Math.round(breakdown.reduce((total, item) => total + item.amount_azn, 0)),
    breakdown,
    is_estimate: true
  };
}

module.exports = { COSTS_AZN, estimateMonthlyCost, validateInputs };
