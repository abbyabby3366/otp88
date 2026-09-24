/* ==========================================================================
   OTP88 landing-page demo. Runs entirely in the browser: no message is sent,
   nothing is billed. Real sends need an API key (see /docs.html).
   ========================================================================== */

let currentChannel = 'whatsapp';
let isSimulating = false;

document.addEventListener('DOMContentLoaded', initSimulator);

function initSimulator() {
  const triggerBtn = document.getElementById('sim-trigger-btn');
  const channelTabs = document.querySelectorAll('[data-sim-channel]');

  channelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      channelTabs.forEach(t => {
        t.classList.remove('btn-primary');
        t.classList.add('btn-secondary');
      });
      tab.classList.remove('btn-secondary');
      tab.classList.add('btn-primary');
      currentChannel = tab.getAttribute('data-sim-channel');
    });
  });

  if (triggerBtn) triggerBtn.addEventListener('click', runOtpSimulation);
}

const CHANNEL_META = {
  whatsapp: { name: 'WhatsApp', color: '#25D366', latency: '0.8s' },
  sms: { name: 'SMS', color: '#10B981', latency: '1.4s' },
  email: { name: 'Email', color: '#0284C7', latency: '0.6s' }
};

function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function runOtpSimulation() {
  if (isSimulating) return;
  isSimulating = true;

  const triggerBtn = document.getElementById('sim-trigger-btn');
  const notifContainer = document.getElementById('sim-notif-container');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const simLog = document.getElementById('sim-status-log');
  const verifyStatus = document.getElementById('sim-verify-status');
  const phoneInput = document.getElementById('sim-phone-input');
  const target = phoneInput ? phoneInput.value.trim() || '+60123456789' : '+60123456789';
  const meta = CHANNEL_META[currentChannel] || CHANNEL_META.whatsapp;
  const otpCode = randomOtp();

  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Sending…</span>';
  }
  if (notifContainer) notifContainer.innerHTML = '';
  if (verifyStatus) verifyStatus.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Waiting for the code…</span>';
  otpBoxes.forEach(box => { box.innerText = ''; box.classList.remove('filled'); });
  if (simLog) simLog.innerHTML = `<span style="color:var(--text-cyan);">[demo]</span> Routing to ${target} via ${meta.name}…`;

  await sleep(650);
  if (simLog) simLog.innerHTML = `<span style="color:var(--text-emerald);">[demo]</span> ${meta.name} accepted in ${meta.latency}`;

  await sleep(300);
  renderPhoneNotification({ channel: currentChannel, otpCode, target });

  await sleep(600);
  for (let i = 0; i < otpCode.length; i++) {
    await sleep(140);
    if (otpBoxes[i]) {
      otpBoxes[i].innerText = otpCode[i];
      otpBoxes[i].classList.add('filled');
    }
  }

  await sleep(300);
  if (verifyStatus) {
    verifyStatus.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text-emerald);font-weight:700;font-size:13px;background:rgba(16,185,129,0.15);padding:8px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>VERIFIED IN ${meta.latency}</span>
      </div>
    `;
  }
  if (window.showToast) window.showToast(`Demo complete: ${meta.name} code ${otpCode}. Sign in to send real OTPs.`);

  isSimulating = false;
  if (triggerBtn) {
    triggerBtn.disabled = false;
    triggerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Run demo again</span>';
  }
}

function renderPhoneNotification({ channel, otpCode }) {
  const notifContainer = document.getElementById('sim-notif-container');
  if (!notifContainer) return;
  const meta = CHANNEL_META[channel] || CHANNEL_META.whatsapp;

  const icons = {
    whatsapp: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382C17.11 14.2 15.334 13.326 15.002 13.206C14.67 13.086 14.428 13.026 14.186 13.388C13.944 13.75 13.25 14.564 13.038 14.806C12.826 15.048 12.614 15.078 12.252 14.896C11.89 14.714 10.724 14.332 9.342 13.1C8.266 12.14 7.54 10.956 7.328 10.594C7.116 10.232 7.306 10.036 7.488 9.856C7.65 9.694 7.85 9.432 8.032 9.22C8.214 9.008 8.274 8.856 8.396 8.614C8.518 8.372 8.458 8.16 8.368 7.978C8.278 7.796 7.552 6.012 7.25 5.288C6.956 4.582 6.658 4.678 6.438 4.668L5.744 4.656C5.502 4.656 5.11 4.746 4.778 5.108C4.446 5.47 3.51 6.346 3.51 8.128C3.51 9.91 4.808 11.632 4.99 11.874C5.172 12.116 7.544 15.772 11.176 17.342C12.04 17.714 12.714 17.938 13.24 18.106C14.108 18.382 14.896 18.342 15.52 18.25C16.216 18.146 17.662 17.374 17.964 16.528C18.266 15.682 18.266 14.958 18.176 14.806C18.086 14.654 17.844 14.564 17.472 14.382Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.82 2.486 15.53 3.334 17.004L2.062 21.652C1.986 21.93 2.222 22.186 2.504 22.128L7.262 21.018C8.686 21.758 10.298 22.176 12 22.176C17.523 22.176 22 17.7 22 12.176C22 6.654 17.523 2 12 2ZM3.858 12C3.858 7.502 7.502 3.858 12 3.858C16.498 3.858 20.142 7.502 20.142 12C20.142 16.498 16.498 20.142 12 20.142C10.518 20.142 9.124 19.746 7.922 19.056L7.636 18.892L4.622 19.596L5.352 16.92L5.166 16.618C4.336 15.272 3.858 13.692 3.858 12Z"/></svg>`,
    sms: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    email: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><polyline points="3 7 12 13 21 7"></polyline></svg>`
  };

  notifContainer.innerHTML = `
    <div class="notification-banner">
      <div class="notif-header">
        <div class="notif-channel" style="color: ${meta.color}; display: flex; align-items: center; gap: 6px;">
          ${icons[channel] || icons.whatsapp}
          <span>${meta.name} • OTP88</span>
        </div>
        <span style="color: var(--text-muted);">Just now</span>
      </div>
      <div class="notif-body">
        Your verification code is:
        <div><strong class="otp-highlight">${otpCode}</strong></div>
        <span style="font-size:10px;color:var(--text-muted);display:block;margin-top:2px;">Expires in 5 minutes • demo only</span>
      </div>
    </div>
  `;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
