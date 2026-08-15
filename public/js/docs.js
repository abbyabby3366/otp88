/* ==========================================================================
   OTP88 Developer Docs & Live API Sandbox Controller
   ========================================================================== */

const CODE_EXAMPLES = {
  curl: `curl -X POST https://api.otp88.com/v1/otp/send \\
  -H "Authorization: Bearer otp88_api_99882200aabbcc" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+60123456789",
    "channel_strategy": "waterfall",
    "channels": ["whatsapp", "telegram", "sms"],
    "sender_name": "Alibaba",
    "otp": "882910"
  }'`,

  node: `const axios = require('axios');

async function sendOTP() {
  const response = await axios.post('https://api.otp88.com/v1/otp/send', {
    to: '+60123456789',
    channel_strategy: 'waterfall',
    channels: ['whatsapp', 'telegram', 'sms'],
    sender_name: 'OTP88_AUTH',
    otp: '882910'
  }, {
    headers: {
      'Authorization': 'Bearer otp88_api_99882200aabbcc',
      'Content-Type': 'application/json'
    }
  });

  console.log('OTP Dispatched:', response.data);
}

sendOTP();`,

  python: `import requests

url = "https://api.otp88.com/v1/otp/send"
headers = {
    "Authorization": "Bearer otp88_api_99882200aabbcc",
    "Content-Type": "application/json"
}
payload = {
    "to": "+60123456789",
    "channel_strategy": "waterfall",
    "channels": ["whatsapp", "telegram", "sms"],
    "sender_name": "Alibaba",
    "otp": "882910"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,

  go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	payload := map[string]interface{}{
		"to":               "+60123456789",
		"channel_strategy": "waterfall",
		"channels":         []string{"whatsapp", "telegram", "sms"},
		"sender_name":      "Alibaba",
		"otp":              "882910",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://api.otp88.com/v1/otp/send", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer otp88_api_99882200aabbcc")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	fmt.Println("Status:", resp.Status)
}`,

  php: `<?php
$ch = curl_init('https://api.otp88.com/v1/otp/send');

$payload = json_encode([
    'to' => '+60123456789',
    'channel_strategy' => 'waterfall',
    'channels' => ['whatsapp', 'telegram', 'sms'],
    'sender_name' => 'Alibaba',
    'otp' => '882910'
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer otp88_api_99882200aabbcc',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
curl_close($ch);

echo $result;
?>`
};

document.addEventListener('DOMContentLoaded', () => {
  initCodeSwitcher();
  initApiTester();
});

function initCodeSwitcher() {
  const tabs = document.querySelectorAll('[data-code-lang]');
  const codePre = document.getElementById('api-sample-code');

  if (!tabs || !codePre) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const lang = tab.getAttribute('data-code-lang');
      if (CODE_EXAMPLES[lang]) {
        codePre.innerText = CODE_EXAMPLES[lang];
      }
    });
  });
}

function initApiTester() {
  const sendBtn = document.getElementById('sandbox-send-btn');
  const responseBox = document.getElementById('sandbox-response-box');

  if (!sendBtn || !responseBox) return;

  sendBtn.addEventListener('click', async () => {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Executing API Call...</span>';
    responseBox.innerText = 'Sending payload to OTP88 Gateway...';

    const testPhone = document.getElementById('sandbox-phone')?.value || '+60123456789';
    const testChannel = document.getElementById('sandbox-channel')?.value || 'waterfall';

    try {
      const res = await fetch('/api/simulate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhone,
          channel: testChannel,
          codeLength: 6
        })
      });

      const data = await res.json();
      responseBox.innerText = JSON.stringify(data, null, 2);
      if (window.showToast) {
        window.showToast('200 OK — OTP Request Dispatched Successfully!');
      }
    } catch (e) {
      responseBox.innerText = '{"error": "Failed to connect to gateway"}';
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span>Run Sandbox Request</span>';
    }
  });
}
