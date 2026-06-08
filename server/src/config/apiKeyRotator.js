const fs = require('fs');
const path = require('path');

class ApiKeyRotator {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.failedKeys = new Map(); // key -> failTimestamp
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes cooldown for a failed key
    this.init();
  }

  init() {
    const rawKeys = process.env.GEMINI_API_KEY;
    if (!rawKeys) {
      console.warn('⚠️  No GEMINI_API_KEY configured for rotator.');
      return;
    }

    // Support comma-separated keys
    this.keys = rawKeys
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k && k !== 'your_gemini_api_key_here');

    if (this.keys.length > 0) {
      console.log(`✅ API Key Rotator initialized with ${this.keys.length} keys.`);
    } else {
      console.warn('⚠️  Rotator has 0 valid API keys.');
    }
  }

  // Get the current valid key, skipping those in cooldown
  getKey() {
    if (this.keys.length === 0) {
      return '';
    }

    const now = Date.now();
    let checkedCount = 0;

    while (checkedCount < this.keys.length) {
      const candidateKey = this.keys[this.currentIndex];
      const failTime = this.failedKeys.get(candidateKey);

      // Check if the key is not in cooldown
      if (!failTime || now - failTime > this.cooldownPeriod) {
        // If it was failed but cooldown expired, clean up the fail map
        if (failTime) {
          this.failedKeys.delete(candidateKey);
          console.log(`🔄 API Key ${this.maskKey(candidateKey)} cooldown expired. Restoring key.`);
        }
        return candidateKey;
      }

      // Move to next key if candidate is in cooldown
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      checkedCount++;
    }

    // If all keys are in cooldown, fallback to the current index key anyway
    console.warn('⚠️  All configured Gemini API keys are currently in cooldown. Falling back to default.');
    return this.keys[this.currentIndex];
  }

  // Mark a key as failed
  markCurrentKeyFailed(key, error) {
    if (!key || !this.keys.includes(key)) return;

    console.error(`❌ API Key ${this.maskKey(key)} failed. Error: ${error.message || error}`);
    this.failedKeys.set(key, Date.now());

    // Rotate to next key immediately
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      const newKey = this.keys[this.currentIndex];
      console.log(`🔄 Rotated to next API Key: ${this.maskKey(newKey)}`);
      
      // Keep process.env updated as well for other libraries
      process.env.GEMINI_API_KEY = newKey;
    }
  }

  getKeyCount() {
    return this.keys.length;
  }

  maskKey(key) {
    if (!key || key.length < 8) return '***';
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }
}

const instance = new ApiKeyRotator();
module.exports = instance;
