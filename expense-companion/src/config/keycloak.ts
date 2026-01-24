import Keycloak from 'keycloak-js';
import { getConfig } from '@/lib/env';

// Get validated configuration
const config = getConfig();

// Keycloak configuration from environment
const keycloakConfig = {
  url: config.keycloak.url,
  realm: config.keycloak.realm,
  clientId: config.keycloak.clientId,
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
