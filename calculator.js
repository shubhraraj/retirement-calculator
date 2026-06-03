// ---- Math functions ----

function futureValue(present, monthlyContrib, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return present + monthlyContrib * n;
  const fvPresent = present * Math.pow(1 + r, n);
  const fvContribs = monthlyContrib * ((Math.pow(1 + r, n) - 1) / r);
  return fvPresent + fvContribs;
}

function calcRetirementTarget(annualIncome, withdrawalRate) {
  return (annualIncome * 0.8) / (withdrawalRate / 100);
}

function calcMonthlyGap(target, projected, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (projected >= target) return 0;
  const shortfall = target - projected;
  if (r === 0) return shortfall / n;
  return shortfall * r / (Math.pow(1 + r, n) - 1);
}

function calcReadiness(projected, target) {
  return Math.min((projected / target) * 100, 100);
}

function formatCurrency(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
  return '$' + Math.round(n).toLocaleString();
}

function buildChartData(currentAge, retirementAge, currentSavings, monthlyContrib, annualRate, target) {
  const labels = [];
  const projected = [];
  const targetLine = [];
  const years = retirementAge - currentAge;
  for (let age = currentAge; age <= retirementAge; age++) {
    const y = age - currentAge;
    labels.push(age);
    projected.push(Math.round(futureValue(currentSavings, monthlyContrib, annualRate, y)));
    targetLine.push(Math.round((target / years) * y));
  }
  return { labels, projected, targetLine };
}

// ---- DOM references ----

const ids = [
  'currentAge','retirementAge','annualIncome','currentSavings','monthlySavings',
  'returnRate','inflationRate','socialSecurity','employerMatch','withdrawalRate'
];

function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function allSimpleInputsFilled() {
  return getVal('currentAge') > 0 &&
    getVal('retirementAge') > getVal('currentAge') &&
    getVal('annualIncome') > 0 &&
    getVal('monthlySavings') >= 0;
}

// ---- Location helpers ----

function getSelectedCountryCode() {
  return document.getElementById('countrySelect').value;
}

function getSelectedStateColIndex() {
  const stateSelect = document.getElementById('stateSelect');
  return stateSelect.options.length > 0
    ? parseFloat(stateSelect.options[stateSelect.selectedIndex].dataset.col) || 1.0
    : 1.0;
}

function getSelectedStateName() {
  const stateSelect = document.getElementById('stateSelect');
  return stateSelect.options.length > 0
    ? stateSelect.options[stateSelect.selectedIndex].text
    : '';
}

function populateStateDropdown(countryCode) {
  const stateSelect = document.getElementById('stateSelect');
  const stateField = document.getElementById('stateField');
  const states = LOCATION_DATA.states[countryCode];

  if (states) {
    stateSelect.innerHTML = states
      .map(s => `<option data-col="${s.colIndex}">${s.name}</option>`)
      .join('');
    stateField.classList.remove('hidden');
  } else {
    stateSelect.innerHTML = '';
    stateField.classList.add('hidden');
  }
}

function updateLocationExplainer(countryCode, stateName, stateColIndex) {
  const explainer = document.getElementById('locationExplainer');
  const icon = document.getElementById('explainerIcon');
  const text = document.getElementById('explainerText');
  const country = LOCATION_DATA.countries[countryCode];
  const explainerFn = LOCATION_DATA.explainers[countryCode];

  text.textContent = explainerFn(stateName, stateColIndex);
  icon.textContent = country.taxesRetirement ? '⚠️' : '💡';
  explainer.className = 'location-explainer' + (country.taxesRetirement ? ' tax-warning' : '');
  explainer.removeAttribute('hidden');
}

// ---- Chart instance ----

let chart = null;

function renderChart(data) {
  const ctx = document.getElementById('projectionChart');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Projected Savings',
          data: data.projected,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79,70,229,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        },
        {
          label: 'Target Path',
          data: data.targetLine,
          borderColor: '#e11d48',
          borderDash: [6, 4],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + formatCurrency(ctx.parsed.y)
          }
        }
      },
      scales: {
        y: {
          ticks: { callback: v => formatCurrency(v) },
          grid: { color: '#f0f0f0' }
        },
        x: {
          title: { display: true, text: 'Age' },
          grid: { display: false }
        }
      }
    }
  });
}

// ---- Main update function ----

function update() {
  if (!allSimpleInputsFilled()) return;

  const currentAge    = getVal('currentAge');
  const retirementAge = getVal('retirementAge');
  const annualIncome  = getVal('annualIncome');
  const currentSavings = getVal('currentSavings');
  const monthlySavings = getVal('monthlySavings');
  const returnRate    = getVal('returnRate') || 7;
  const employerMatch = getVal('employerMatch');
  const withdrawalRate = getVal('withdrawalRate') || 4;
  const socialSecurity = getVal('socialSecurity');

  const years = retirementAge - currentAge;
  const effectiveMonthly = monthlySavings * (1 + employerMatch / 100);

  const baseTarget = calcRetirementTarget(annualIncome, withdrawalRate);

  // Reduce base target by PV of Social Security income stream
  const ssAnnual = socialSecurity * 12;
  const ssCorpus = ssAnnual / (withdrawalRate / 100);
  const ssAdjustedTarget = Math.max(baseTarget - ssCorpus, 0);

  // Apply location adjustment (COL, healthcare, tax)
  const countryCode = getSelectedCountryCode();
  const stateColIndex = getSelectedStateColIndex();
  const stateName = getSelectedStateName();
  const adjustedTarget = applyLocationAdjustment(ssAdjustedTarget, countryCode, stateColIndex);

  const projected = futureValue(currentSavings, effectiveMonthly, returnRate, years);
  const gap = calcMonthlyGap(adjustedTarget, projected, returnRate, years);
  const readiness = calcReadiness(projected, adjustedTarget);

  // Update stat cards
  document.getElementById('statTarget').textContent = formatCurrency(adjustedTarget);
  document.getElementById('statProjected').textContent = formatCurrency(projected);

  // Update location pill
  const country = LOCATION_DATA.countries[countryCode];
  const locationLabel = stateName ? `📍 ${stateName}, ${country.name}` : `📍 ${country.name}`;
  document.getElementById('statLocation').textContent = locationLabel;

  // Update explainer
  updateLocationExplainer(countryCode, stateName, stateColIndex);

  const gapCard = document.getElementById('gapCard');
  const gapEl = document.getElementById('statGap');
  const gapSub = document.getElementById('gapSub');
  if (gap <= 0) {
    gapEl.textContent = 'On Track';
    gapSub.textContent = "you're ahead of target";
    gapCard.className = 'stat-card on-track';
  } else {
    gapEl.textContent = formatCurrency(gap) + '/mo';
    gapSub.textContent = 'more needed/month';
    gapCard.className = 'stat-card behind';
  }

  // Readiness bar
  const pct = Math.round(readiness);
  document.getElementById('readinessPct').textContent = pct + '%';
  const bar = document.getElementById('readinessBar');
  bar.style.width = pct + '%';
  bar.className = 'readiness-bar-fill ' + (pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red');

  // Show results
  document.getElementById('results').removeAttribute('hidden');

  // Chart
  const chartData = buildChartData(currentAge, retirementAge, currentSavings, effectiveMonthly, returnRate, adjustedTarget);
  renderChart(chartData);
}

// ---- Event wiring ----

ids.forEach(id => {
  document.getElementById(id).addEventListener('input', update);
});

document.getElementById('advancedToggle').addEventListener('change', function () {
  document.querySelectorAll('.advanced-field').forEach(el => {
    el.classList.toggle('visible', this.checked);
  });
  update();
});

document.getElementById('countrySelect').addEventListener('change', function () {
  populateStateDropdown(this.value);
  update();
});

document.getElementById('stateSelect').addEventListener('change', update);

// Initialise state dropdown on page load
populateStateDropdown('US');
