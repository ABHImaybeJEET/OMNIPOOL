const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKeyRotator = require('../config/apiKeyRotator');

/**
 * Generate a 768-dimensional embedding vector for the given text.
 * Uses Gemini's gemini-embedding-2 model.
 */
const generateEmbedding = async (text) => {
  const keyCount = apiKeyRotator.getKeyCount();
  if (keyCount === 0) {
    console.warn('GEMINI_API_KEY is missing. Skipping embedding generation.');
    return new Array(768).fill(0);
  }

  let attempts = 0;
  const maxAttempts = Math.max(2, keyCount);

  while (attempts < maxAttempts) {
    const currentKey = apiKeyRotator.getKey();
    try {
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

      // Set a 5-second timeout for the embedding API call
      const dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS) || 768;
      const resultPromise = model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: dimensions,
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Embedding timeout')), 5000)
      );
      
      const result = await Promise.race([resultPromise, timeoutPromise]);
      return result.embedding.values;
    } catch (error) {
      console.warn(`⚠️ Embedding API request failed on attempt ${attempts + 1}/${maxAttempts}:`, error.message || error);
      
      // Mark key as failed
      apiKeyRotator.markCurrentKeyFailed(currentKey, error);
      
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('Embedding generation completely failed after all attempts:', error.message);
        return new Array(768).fill(0);
      }
    }
  }
};

/**
 * Generate embeddings for an array of text items and average them.
 */
const generateAverageEmbedding = async (textArray) => {
  if (!textArray || textArray.length === 0) {
    return new Array(768).fill(0);
  }

  const combinedText = textArray.join(', ');
  return generateEmbedding(combinedText);
};

module.exports = { generateEmbedding, generateAverageEmbedding };
