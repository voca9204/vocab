import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Settings, Key, Eye, EyeOff, ExternalLink, Check, X } from 'lucide-react';
import openaiService from '../services/openaiService';
import './OpenAISettings.css';

/**
 * OpenAI Settings Component
 * 
 * Allows users to configure OpenAI API settings and view service statistics.
 */

const OpenAISettings = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testWord, setTestWord] = useState('eloquent');
  const [testDefinition, setTestDefinition] = useState('having or showing the ability to use language clearly and effectively');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Load current API key from environment (if available)
      const currentKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (currentKey && currentKey !== 'your_openai_api_key_here') {
        setApiKey(currentKey);
      }
      
      // Load service statistics
      setStats(openaiService.getServiceStats());
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!testWord.trim() || !testDefinition.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both a test word and definition'
      });
      return;
    }

    setIsTestLoading(true);
    setTestResult(null);

    try {
      const result = await openaiService.generateExampleSentences(
        testWord,
        testDefinition,
        { difficulty: 'medium' }
      );

      setTestResult({
        success: result.success,
        message: result.success 
          ? `Generated ${result.examples.length} examples (Source: ${result.source})`
          : `Failed: ${result.error}`,
        examples: result.examples,
        source: result.source
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleClearCache = () => {
    const result = openaiService.clearCache();
    setStats(openaiService.getServiceStats());
    alert(result.message);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="openai-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Settings size={20} />
            OpenAI Settings
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* API Key Configuration */}
          <div className="settings-section">
            <h3>
              <Key size={16} />
              API Configuration
            </h3>
            
            <div className="form-group">
              <label htmlFor="apiKey">OpenAI API Key</label>
              <div className="api-key-input">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="api-key-field"
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="form-help">
                <p>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  OpenAI Platform <ExternalLink size={12} />
                </a></p>
                <p><strong>Note:</strong> API key changes require a page refresh to take effect.</p>
              </div>
            </div>
          </div>

          {/* Service Statistics */}
          <div className="settings-section">
            <h3>Service Statistics</h3>
            {stats && (
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">API Key Status:</span>
                  <span className={`stat-value ${stats.apiKeyConfigured ? 'success' : 'error'}`}>
                    {stats.apiKeyConfigured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cache Size:</span>
                  <span className="stat-value">
                    {stats.cacheSize} / {stats.maxCacheSize}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Requests (Last Minute):</span>
                  <span className="stat-value">
                    {stats.requestsInLastMinute} / {stats.rateLimitPerMinute}
                  </span>
                </div>
              </div>
            )}
            
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearCache}
            >
              Clear Cache
            </button>
          </div>

          {/* Test Connection */}
          <div className="settings-section">
            <h3>Test Connection</h3>
            
            <div className="test-inputs">
              <div className="form-group">
                <label htmlFor="testWord">Test Word</label>
                <input
                  id="testWord"
                  type="text"
                  value={testWord}
                  onChange={(e) => setTestWord(e.target.value)}
                  placeholder="Enter a word to test"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="testDefinition">Test Definition</label>
                <input
                  id="testDefinition"
                  type="text"
                  value={testDefinition}
                  onChange={(e) => setTestDefinition(e.target.value)}
                  placeholder="Enter the definition"
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTestConnection}
              disabled={isTestLoading}
            >
              {isTestLoading ? 'Testing...' : 'Test Generation'}
            </button>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  {testResult.success ? <Check size={16} /> : <X size={16} />}
                  <span>{testResult.message}</span>
                </div>
                
                {testResult.examples && testResult.examples.length > 0 && (
                  <div className="result-examples">
                    <h4>Generated Examples:</h4>
                    <ul>
                      {testResult.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Usage Information */}
          <div className="settings-section">
            <h3>Usage Information</h3>
            <div className="usage-info">
              <p><strong>Rate Limiting:</strong> 10 requests per minute</p>
              <p><strong>Caching:</strong> Generated examples are cached for 24 hours</p>
              <p><strong>Fallback:</strong> Manual examples used when API is unavailable</p>
              <p><strong>Cost:</strong> Approximately $0.001-0.002 per example generation</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

OpenAISettings.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default OpenAISettings;