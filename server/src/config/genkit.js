const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');
const apiKeyRotator = require('./apiKeyRotator');

// Dynamic string proxy for the API key to bypass Genkit startup initialization caching.
// Whenever Google GenAI SDK constructs the call headers, it will call toString() on this object
// to get the active rotated key.
const dynamicApiKey = {
  toString() {
    return apiKeyRotator.getKey();
  }
};

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: dynamicApiKey,
    }),
  ],
  model: googleAI.model('gemini-2.5-flash'),
});

module.exports = ai;
