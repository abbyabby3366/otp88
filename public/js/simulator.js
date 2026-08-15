/* ==========================================================================
   OTP88 Interactive Phone Simulator & Smart Waterfall Controller
   ========================================================================== */

let currentChannel = 'waterfall';
let currentOtpCode = '882049';
let isSimulating = false;

document.addEventListener('DOMContentLoaded', () => {
  initSimulator();
});

function initSimulator() {
  const triggerBtn = document.getElementById('sim-trigger-btn');
  const channelTabs = document.querySelectorAll('[data-sim-channel]');
  const phoneInput = document.getElementById('sim-phone-input');

  if (channelTabs) {
    channelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        channelTabs.forEach(t => t.classList.remove('btn-primary', 'btn-outline-emerald'));
        channelTabs.forEach(t => t.classList.add('btn-secondary'));
        tab.classList.remove('btn-secondary');
        tab.classList.add('btn-primary');
        currentChannel = tab.getAttribute('data-sim-channel');
      });
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      runOtpSimulation();
    });
  }
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
  const phoneVal = phoneInput ? phoneInput.value : '+60123456789';

  // Reset UI
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Routing OTP...</span>';
  }
  if (notifContainer) notifContainer.innerHTML = '';
  if (verifyStatus) verifyStatus.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">Gateway dispatching request...</span>';
  otpBoxes.forEach(box => {
    box.innerText = '';
    box.classList.remove('filled');
  });

  if (simLog) {
    simLog.innerHTML = `<span style="color:var(--text-cyan);">[Gateway]</span> Interconnecting direct route for ${phoneVal}...`;
  }

  try {
    const res = await fetch('/api/simulate-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneVal,
        channel: currentChannel,
        senderId: 'OTP88_SECURE',
        codeLength: 6
      })
    });

    const data = await res.json();
    currentOtpCode = data.otpCode;

    // Simulate Network Latency step
    await sleep(650);

    if (simLog) {
      simLog.innerHTML = `<span style="color:var(--text-emerald);">[Anti-Fraud]</span> AIT Check: Clean (Score 3/100) • Latency: ${data.latency}`;
    }

    // Step 2: Push Notification in Phone
    await sleep(300);
    renderPhoneNotification(data);

    // Step 3: Type OTP code into boxes
    await sleep(600);
    for (let i = 0; i < currentOtpCode.length; i++) {
      await sleep(140);
      if (otpBoxes[i]) {
        otpBoxes[i].innerText = currentOtpCode[i];
        otpBoxes[i].classList.add('filled');
      }
    }

    // Step 4: Verification Success
    await sleep(300);
    if (verifyStatus) {
      verifyStatus.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text-emerald);font-weight:700;font-size:13px;background:rgba(16,185,129,0.15);padding:8px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>AUTHENTICATED IN ${data.latency}</span>
        </div>
      `;
    }

    if (window.showToast) {
      window.showToast(`OTP Verified! Delivered via ${data.channelUsed} in ${data.latency}`);
    }

  } catch (e) {
    console.error('Sim error', e);
  } finally {
    isSimulating = false;
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Send Another OTP</span>';
    }
  }
}

function renderPhoneNotification(data) {
  const notifContainer = document.getElementById('sim-notif-container');
  if (!notifContainer) return;

  let channelSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382C17.11 14.2 15.334 13.326 15.002 13.206C14.67 13.086 14.428 13.026 14.186 13.388C13.944 13.75 13.25 14.564 13.038 14.806C12.826 15.048 12.614 15.078 12.252 14.896C11.89 14.714 10.724 14.332 9.342 13.1C8.266 12.14 7.54 10.956 7.328 10.594C7.116 10.232 7.306 10.036 7.488 9.856C7.65 9.694 7.85 9.432 8.032 9.22C8.214 9.008 8.274 8.856 8.396 8.614C8.518 8.372 8.458 8.16 8.368 7.978C8.278 7.796 7.552 6.012 7.25 5.288C6.956 4.582 6.658 4.678 6.438 4.668L5.744 4.656C5.502 4.656 5.11 4.746 4.778 5.108C4.446 5.47 3.51 6.346 3.51 8.128C3.51 9.91 4.808 11.632 4.99 11.874C5.172 12.116 7.544 15.772 11.176 17.342C12.04 17.714 12.714 17.938 13.24 18.106C14.108 18.382 14.896 18.342 15.52 18.25C16.216 18.146 17.662 17.374 17.964 16.528C18.266 15.682 18.266 14.958 18.176 14.806C18.086 14.654 17.844 14.564 17.472 14.382Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.82 2.486 15.53 3.334 17.004L2.062 21.652C1.986 21.93 2.222 22.186 2.504 22.128L7.262 21.018C8.686 21.758 10.298 22.176 12 22.176C17.523 22.176 22 17.7 22 12.176C22 6.654 17.523 2 12 2ZM3.858 12C3.858 7.502 7.502 3.858 12 3.858C16.498 3.858 20.142 7.502 20.142 12C20.142 16.498 16.498 20.142 12 20.142C10.518 20.142 9.124 19.746 7.922 19.056L7.636 18.892L4.622 19.596L5.352 16.92L5.166 16.618C4.336 15.272 3.858 13.692 3.858 12Z"/></svg>`;
  let channelName = 'WhatsApp';
  let badgeColor = '#25D366';

  if (data.channelUsed.toLowerCase().includes('telegram')) {
    channelSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M21.68 3.658C21.328 3.376 20.85 3.332 20.45 3.518L2.45 10.984C1.944 11.194 1.636 11.71 1.698 12.254C1.76 12.798 2.176 13.228 2.72 13.31L7.544 14.038L9.508 19.79C9.696 20.34 10.224 20.696 10.804 20.664C11.384 20.632 11.874 20.218 12.008 19.65L13.796 16.148L17.784 19.346C18.118 19.614 18.558 19.71 18.974 19.608C19.39 19.506 19.73 19.218 19.894 18.828L22.28 4.992C22.418 4.516 22.032 3.94 21.68 3.658ZM17.654 7.158L8.798 14.596L8.318 13.186L17.654 7.158Z"/></svg>`;
    channelName = 'Telegram';
    badgeColor = '#229ED9';
  } else if (data.channelUsed.toLowerCase().includes('sms')) {
    channelSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    channelName = 'Direct SMS';
    badgeColor = '#10B981';
  } else if (data.channelUsed.toLowerCase().includes('voice')) {
    channelSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    channelName = 'Voice OTP';
    badgeColor = '#8B5CF6';
  }

  notifContainer.innerHTML = `
    <div class="notification-banner">
      <div class="notif-header">
        <div class="notif-channel" style="color: ${badgeColor}; display: flex; align-items: center; gap: 6px;">
          ${channelSvg}
          <span>${channelName} • OTP88</span>
        </div>
        <span style="color: var(--text-muted);">Just now</span>
      </div>
      <div class="notif-body">
        Your login verification code is:
        <div><strong class="otp-highlight">${data.otpCode}</strong></div>
        <span style="font-size:10px;color:var(--text-muted);display:block;margin-top:2px;">Expires in 5m • TxID: ${data.transactionId.substring(0, 12)}...</span>
      </div>
    </div>
  `;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
