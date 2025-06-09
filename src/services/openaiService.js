/**
 * OpenAI API Service for generating vocabulary example sentences
 * Features: Rate limiting, caching, error handling, and fallback mechanisms
 */

class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo';
    this.maxTokens = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS) || 150;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
    
    // Rate limiting configuration
    this.rateLimit = {
      requestsPerMinute: 10,
      requests: [],
      getWaitTime: () => this.calculateWaitTime()
    };
    
    // Cache configuration
    this.cache = new Map();
    this.cacheMaxSize = 500;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Initialize cache cleanup
    this.initializeCacheCleanup();
  }

  /**
   * Calculate wait time for rate limiting
   */
  calculateWaitTime() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old requests
    this.rateLimit.requests = this.rateLimit.requests.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    if (this.rateLimit.requests.length >= this.rateLimit.requestsPerMinute) {
      // Return wait time in milliseconds
      const oldestRequest = Math.min(...this.rateLimit.requests);
      return (oldestRequest + 60000) - now;
    }
    
    return 0;
  }

  /**
   * Add request to rate limiting tracker
   */
  addRequestToRateLimit() {
    this.rateLimit.requests.push(Date.now());
  }

  /**
   * Generate cache key for vocabulary item
   */
  generateCacheKey(word, definition, options = {}) {
    const baseKey = `${word.toLowerCase()}_${definition.substring(0, 50)}`;
    const optionsKey = JSON.stringify(options);
    return `${baseKey}_${btoa(optionsKey)}`;
  }

  /**
   * Get cached example if available and not expired
   */
  getCachedExample(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const isExpired = (Date.now() - timestamp) > this.cacheExpiry;
    
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return data;
  }

  /**
   * Store example in cache
   */
  setCachedExample(cacheKey, data) {
    // Implement LRU cache behavior
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Initialize periodic cache cleanup
   */
  initializeCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, { timestamp }] of this.cache.entries()) {
        if ((now - timestamp) > this.cacheExpiry) {
          this.cache.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Clean every hour
  }

  /**
   * Generate prompt template for example sentence generation
   */
  generatePrompt(word, definition, options = {}) {
    const {
      difficulty = 'intermediate',
      context = 'academic',
      language = 'english',
      includeTranslation = false
    } = options;

    let prompt = `Generate 2-3 clear, contextual example sentences for the vocabulary word "${word}".

Word: ${word}
Definition: ${definition}
Difficulty Level: ${difficulty}
Context: ${context}

Requirements:
1. Each sentence should clearly demonstrate the meaning of "${word}"
2. Use ${difficulty}-level vocabulary and sentence structure
3. Make sentences relevant to ${context} contexts
4. Each sentence should be 10-20 words long
5. Separate each sentence with a line break

Format your response as:
1. [First example sentence]
2. [Second example sentence]
${includeTranslation ? '3. [Third example sentence]' : ''}

Focus on clarity and educational value. Avoid complex or ambiguous usage.`;

    return prompt;
  }

  /**
   * Make API request to OpenAI
   */
  async makeAPIRequest(prompt) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful English vocabulary tutor. Generate clear, educational example sentences that help students understand word usage.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Parse OpenAI response to extract example sentences
   */
  parseResponse(response) {
    try {
      const content = response.choices[0]?.message?.content || '';
      
      // Extract sentences from numbered list format
      const sentences = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(sentence => sentence.length > 0);

      if (sentences.length === 0) {
        // Fallback: try to extract sentences without numbers
        const fallbackSentences = content
          .split(/[.!?]/)
          .map(s => s.trim())
          .filter(s => s.length > 10)
          .slice(0, 3);
        
        return fallbackSentences.length > 0 ? fallbackSentences : null;
      }

      return sentences;
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return null;
    }
  }

  /**
   * Generate fallback examples when API fails
   */
  generateFallbackExamples(word, definition) {
    const templates = [
      `The word "${word}" means ${definition.toLowerCase()}.`,
      `In this context, "${word}" refers to ${definition.toLowerCase()}.`,
      `We can understand "${word}" as ${definition.toLowerCase()}.`
    ];

    return templates.slice(0, 2); // Return 2 fallback examples
  }

  /**
   * Main method to generate example sentences
   */
  async generateExampleSentences(word, definition, options = {}) {
    try {
      // Validate inputs
      if (!word || !definition) {
        throw new Error('Word and definition are required');
      }

      if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
        console.warn('OpenAI API key not configured, using fallback examples');
        return {
          success: true,
          examples: this.generateFallbackExamples(word, definition),
          source: 'fallback',
          cached: false
        };
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(word, definition, options);
      const cachedExample = this.getCachedExample(cacheKey);
      
      if (cachedExample) {
        return {
          success: true,
          examples: cachedExample,
          source: 'cache',
          cached: true
        };
      }

      // Check rate limiting
      const waitTime = this.rateLimit.getWaitTime();
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }

      // Generate prompt and make API request
      const prompt = this.generatePrompt(word, definition, options);
      
      this.addRequestToRateLimit();
      const response = await this.makeAPIRequest(prompt);
      
      // Parse response
      const examples = this.parseResponse(response);
      
      if (!examples || examples.length === 0) {
        throw new Error('Failed to generate valid examples');
      }

      // Cache the result
      this.setCachedExample(cacheKey, examples);

      return {
        success: true,
        examples,
        source: 'openai',
        cached: false,
        usage: response.usage
      };

    } catch (error) {
      console.error('Error generating example sentences:', error);
      
      // Return fallback examples on any error
      return {
        success: false,
        examples: this.generateFallbackExamples(word, definition),
        source: 'fallback',
        error: error.message,
        cached: false
      };
    }
  }

  /**
   * Regenerate examples (bypass cache)
   */
  async regenerateExampleSentences(word, definition, options = {}) {
    // Clear cache for this item
    const cacheKey = this.generateCacheKey(word, definition, options);
    this.cache.delete(cacheKey);
    
    // Generate new examples
    return this.generateExampleSentences(word, definition, options);
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.cacheMaxSize,
      requestsInLastMinute: this.rateLimit.requests.length,
      rateLimitPerMinute: this.rateLimit.requestsPerMinute,
      apiKeyConfigured: !!(this.apiKey && this.apiKey !== 'your_openai_api_key_here')
    };
  }

  /**
   * Clear all cached examples
   */
  clearCache() {
    this.cache.clear();
    return { message: 'Cache cleared successfully' };
  }
}

// Create and export singleton instance
const openaiService = new OpenAIService();

export default openaiService;