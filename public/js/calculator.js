/* ==========================================================================
   OTP88 Interactive Pricing Calculator & Rate Table Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPricingCalculator();
  initRateTable();
});

let allRatesData = [];

let calcDebounceTimer = null;
function triggerRecalculate() {
  if (calcDebounceTimer) clearTimeout(calcDebounceTimer);
  calcDebounceTimer = setTimeout(() => {
    recalculateCost();
  }, 40);
}

async function initPricingCalculator() {
  const countrySelect = document.getElementById('calc-country-select');
  const volumeSlider = document.getElementById('calc-volume-slider');
  const volumeDisplay = document.getElementById('calc-volume-display');

  if (!volumeSlider || !countrySelect) return;

  // Volume Slider Sync
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (volumeDisplay) volumeDisplay.innerText = val.toLocaleString() + ' OTPs / mo';
    triggerRecalculate();
  }, { passive: true });

  countrySelect.addEventListener('change', () => {
    triggerRecalculate();
  });

  // Channel Mix inputs
  ['w-pct', 't-pct', 's-pct', 'v-pct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', triggerRecalculate, { passive: true });
  });

  // Initial Calculation
  recalculateCost();
}

async function recalculateCost() {
  const countrySelect = document.getElementById('calc-country-select');
  const volumeSlider = document.getElementById('calc-volume-slider');
  const costTotalEl = document.getElementById('calc-total-cost');
  const savingsAmountEl = document.getElementById('calc-savings-amount');
  const savingsPctEl = document.getElementById('calc-savings-pct');
  const legacyCostEl = document.getElementById('calc-legacy-cost');
  const discountBadge = document.getElementById('calc-discount-tier');

  const countryCode = countrySelect ? countrySelect.value : 'MY';
  const volume = volumeSlider ? parseInt(volumeSlider.value, 10) : 50000;

  const wPct = parseInt(document.getElementById('w-pct')?.value || 60, 10);
  const tPct = parseInt(document.getElementById('t-pct')?.value || 15, 10);
  const sPct = parseInt(document.getElementById('s-pct')?.value || 20, 10);
  const vPct = parseInt(document.getElementById('v-pct')?.value || 5, 10);

  try {
    const res = await fetch('/api/calculate-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode,
        monthlyVolume: volume,
        whatsappPct: wPct,
        telegramPct: tPct,
        smsPct: sPct,
        voicePct: vPct
      })
    });

    const data = await res.json();
    if (!data.success) return;

    if (costTotalEl) costTotalEl.innerText = `$${data.totalMonthlyCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (savingsAmountEl) savingsAmountEl.innerText = `Save $${data.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo ($${data.annualSavings.toLocaleString('en-US', { minimumFractionDigits: 0 })}/yr)`;
    if (savingsPctEl) savingsPctEl.innerText = `${data.savingsPercentage}% Cheaper`;
    if (legacyCostEl) legacyCostEl.innerText = `$${data.legacySmsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (discountBadge) discountBadge.innerText = `${data.discountTier} Volume Tier Applied`;

  } catch (err) {
    console.error('Pricing calc error', err);
  }
}

// 2. Global Rate Table Population & Search
async function initRateTable() {
  const tableBody = document.getElementById('rates-table-body');
  const searchInput = document.getElementById('rate-search-input');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/rates');
    const data = await res.json();
    if (data.success) {
      allRatesData = data.data;
      renderRateTable(allRatesData);
    }
  } catch (err) {
    console.error('Failed to load rates', err);
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allRatesData.filter(r => 
        r.country.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.dialCode.includes(q)
      );
      renderRateTable(filtered);
    });
  }
}

function renderRateTable(rates) {
  const tableBody = document.getElementById('rates-table-body');
  if (!tableBody) return;

  if (rates.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted);">No matching countries found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = rates.map(r => `
    <tr>
      <td>
        <div class="country-cell">
          <span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-subtle);padding:3px 7px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:var(--text-cyan);">${r.code}</span>
          <div>
            <strong>${r.country}</strong>
            <span style="font-size:12px;color:var(--text-muted);display:block;">${r.dialCode}</span>
          </div>
        </div>
      </td>
      <td><span class="price-tag">$${(r.whatsapp ?? 0.0075).toFixed(4)}</span></td>
      <td><span class="price-tag" style="color:var(--text-cyan);">$${(r.telegram ?? 0.0035).toFixed(4)}</span></td>
      <td>
        ${r.code === 'MY' && r.sms !== null && r.sms !== undefined ? `
          <span class="price-tag">$${Number(r.sms).toFixed(4)}</span>
        ` : `
          <span style="color:var(--text-muted);font-size:12px;">—</span>
        `}
      </td>
      <td><span style="color:var(--text-emerald);font-weight:600;">${r.avgLatency || '0.8s'}</span></td>
      <td>
        <span class="badge-pill" style="font-size:11px;padding:4px 8px;">Active Direct</span>
      </td>
    </tr>
  `).join('');
}
