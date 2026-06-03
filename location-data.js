// ---- Location data ----

const LOCATION_DATA = {
  countries: {
    US: { name: 'United States', flag: '🇺🇸', colIndex: 1.00, healthcareCorpus: 315000, taxesRetirement: false, hasStates: true },
    IN: { name: 'India',         flag: '🇮🇳', colIndex: 0.28, healthcareCorpus: 60000,  taxesRetirement: true,  hasStates: true },
    CA: { name: 'Canada',        flag: '🇨🇦', colIndex: 0.78, healthcareCorpus: 20000,  taxesRetirement: true,  hasStates: false },
    GB: { name: 'United Kingdom',flag: '🇬🇧', colIndex: 0.72, healthcareCorpus: 15000,  taxesRetirement: true,  hasStates: false },
    PT: { name: 'Portugal',      flag: '🇵🇹', colIndex: 0.52, healthcareCorpus: 25000,  taxesRetirement: false, hasStates: false },
    AU: { name: 'Australia',     flag: '🇦🇺', colIndex: 0.88, healthcareCorpus: 30000,  taxesRetirement: true,  hasStates: false },
    AE: { name: 'UAE',           flag: '🇦🇪', colIndex: 0.82, healthcareCorpus: 80000,  taxesRetirement: false, hasStates: false },
    TH: { name: 'Thailand',      flag: '🇹🇭', colIndex: 0.38, healthcareCorpus: 40000,  taxesRetirement: false, hasStates: false },
    MX: { name: 'Mexico',        flag: '🇲🇽', colIndex: 0.45, healthcareCorpus: 45000,  taxesRetirement: false, hasStates: false },
    NZ: { name: 'New Zealand',   flag: '🇳🇿', colIndex: 0.83, healthcareCorpus: 20000,  taxesRetirement: true,  hasStates: false }
  },

  states: {
    US: [
      { name: 'California',      colIndex: 1.35 },
      { name: 'New York',        colIndex: 1.28 },
      { name: 'Massachusetts',   colIndex: 1.22 },
      { name: 'Washington',      colIndex: 1.15 },
      { name: 'Colorado',        colIndex: 1.08 },
      { name: 'Oregon',          colIndex: 1.05 },
      { name: 'Arizona',         colIndex: 0.95 },
      { name: 'Georgia',         colIndex: 0.91 },
      { name: 'North Carolina',  colIndex: 0.90 },
      { name: 'Texas',           colIndex: 0.89 },
      { name: 'Florida',         colIndex: 0.88 },
      { name: 'Tennessee',       colIndex: 0.84 },
      { name: 'Mississippi',     colIndex: 0.79 }
    ],
    IN: [
      { name: 'Maharashtra',     colIndex: 0.35 },
      { name: 'Delhi',           colIndex: 0.34 },
      { name: 'Karnataka',       colIndex: 0.32 },
      { name: 'Goa',             colIndex: 0.31 },
      { name: 'Tamil Nadu',      colIndex: 0.30 },
      { name: 'Telangana',       colIndex: 0.30 },
      { name: 'Gujarat',         colIndex: 0.28 },
      { name: 'Kerala',          colIndex: 0.27 },
      { name: 'West Bengal',     colIndex: 0.26 },
      { name: 'Rajasthan',       colIndex: 0.24 }
    ]
  },

  explainers: {
    US: (stateName, stateCol) => `Your target reflects ${stateName}'s cost of living (${Math.round(stateCol * 100)}% of US average). Healthcare corpus: $315K estimated for US retirees.`,
    IN: (stateName) => `India's cost of living is ~28% of the US. With affordable private healthcare (~$60K corpus), your target drops significantly. Note: retirement income is taxable in India.`,
    CA: () => `Canada's cost of living is ~78% of the US. Provincial healthcare covers most costs (~$20K for supplements). Retirement income is taxable.`,
    GB: () => `UK cost of living is ~72% of the US. NHS covers most healthcare (~$15K for supplements). Retirement income taxable above personal allowance.`,
    PT: () => `Portugal is one of the most affordable retirement destinations — ~52% of US costs. Quality public healthcare available. No tax on foreign retirement income under the NHR scheme.`,
    AU: () => `Australia's cost of living is ~88% of the US. Medicare covers most healthcare (~$30K for extras). Retirement income is taxable but concessional rates apply.`,
    AE: () => `UAE has no income tax — including on retirement income. Cost of living ~82% of US. Private healthcare required (~$80K corpus). Expats should plan for no state pension.`,
    TH: () => `Thailand is extremely affordable — ~38% of US costs. Quality private hospitals are a fraction of US prices (~$40K corpus). No tax on foreign-sourced retirement income.`,
    MX: () => `Mexico is ~45% of US costs. Popular destinations like Oaxaca and San Miguel offer a vibrant lifestyle. Private healthcare is excellent and affordable (~$45K corpus).`,
    NZ: () => `New Zealand's cost of living is ~83% of the US. Public healthcare covers most needs (~$20K for supplements). Retirement income is taxable but there is no capital gains tax.`
  }
};

// ---- Location adjustment math ----

function applyLocationAdjustment(baseTarget, countryCode, stateColIndex) {
  const country = LOCATION_DATA.countries[countryCode];
  // Gross up base target by 15% if retirement income is taxed in this country
  const taxAdjusted = country.taxesRetirement ? baseTarget * (1 / 0.85) : baseTarget;
  return taxAdjusted * country.colIndex * stateColIndex + country.healthcareCorpus;
}
