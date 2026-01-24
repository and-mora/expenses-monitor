/**
 * Environment Variables Validation and Access
 * 
 * This module validates required environment variables at runtime
 * and provides type-safe access to configuration values.
 */

interface EnvConfig {
  // Keycloak
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
  
  // API
  api: {
    baseUrl: string;
    useMockData: boolean;
  };
  
  // Build
  build: {
    sourcemaps: boolean;
  };
  
  // Optional features
  monitoring?: {
    sentryDsn?: string;
    gaId?: string;
  };
  
  features: {
    experimental: boolean;
  };
}

/**
 * Validates that a required environment variable exists
 */
function requireEnv(key: string, fallback?: string): string {
  const value = import.meta.env[key] || fallback;
  
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    throw new Error(
      `Configuration error: ${key} is required but not defined. ` +
      `Please check your .env file or environment configuration.`
    );
  }
  
  return value;
}

/**
 * Gets an optional environment variable with fallback
 */
function getEnv(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback;
}

/**
 * Gets a boolean environment variable
 */
function getBooleanEnv(key: string, fallback: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

/**
 * Validates URL format
 */
function validateUrl(url: string, name: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(
      `Configuration error: ${name} must be a valid URL. Got: ${url}`
    );
  }
}

/**
 * Load and validate environment configuration
 */
function loadConfig(): EnvConfig {
  // Required Keycloak configuration
  const keycloakUrl = requireEnv(
    'VITE_KEYCLOAK_URL',
    'https://auth.expmonitor.freeddns.org'
  );
  
  const keycloakRealm = requireEnv(
    'VITE_KEYCLOAK_REALM',
    'expenses-monitor'
  );
  
  const keycloakClientId = requireEnv(
    'VITE_KEYCLOAK_CLIENT_ID',
    'expenses-monitor-frontend'
  );
  
  // API configuration
  const apiBaseUrl = requireEnv(
    'VITE_API_BASE_URL',
    'http://localhost:8080'
  );
  
  const useMockData = getBooleanEnv('VITE_USE_MOCK_DATA', false);
  
  // Build configuration
  const sourcemaps = getBooleanEnv('VITE_SOURCEMAPS', false);
  
  // Optional monitoring
  const sentryDsn = getEnv('VITE_SENTRY_DSN');
  const gaId = getEnv('VITE_GA_ID');
  
  // Feature flags
  const experimental = getBooleanEnv('VITE_ENABLE_EXPERIMENTAL', false);
  
  // Validate URLs
  validateUrl(keycloakUrl, 'VITE_KEYCLOAK_URL');
  validateUrl(apiBaseUrl, 'VITE_API_BASE_URL');
  
  const config: EnvConfig = {
    keycloak: {
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    },
    api: {
      baseUrl: apiBaseUrl,
      useMockData,
    },
    build: {
      sourcemaps,
    },
    features: {
      experimental,
    },
  };
  
  // Add monitoring if configured
  if (sentryDsn || gaId) {
    config.monitoring = {
      sentryDsn: sentryDsn || undefined,
      gaId: gaId || undefined,
    };
  }
  
  return config;
}

// Export singleton instance
let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    _config = loadConfig();
    
    // Log configuration in development (without sensitive data)
    if (import.meta.env.DEV) {
      console.log('📋 Application Configuration:', {
        keycloak: {
          url: _config.keycloak.url,
          realm: _config.keycloak.realm,
          clientId: _config.keycloak.clientId,
        },
        api: {
          baseUrl: _config.api.baseUrl,
          useMockData: _config.api.useMockData,
        },
        features: _config.features,
      });
    }
  }
  
  return _config;
}

// Export for testing
export { loadConfig };
