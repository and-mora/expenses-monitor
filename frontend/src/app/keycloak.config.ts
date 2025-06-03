import {
  AutoRefreshTokenService,
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  provideKeycloak,
  UserActivityService,
  withAutoRefreshToken
} from 'keycloak-angular';
import { environment } from '../environments/environment';

const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: new RegExp(`^(${environment.apiUrl.replaceAll('/', '\/')})(/.*)?$`, 'i'),
  bearerPrefix: 'Bearer'
});

export const provideKeycloakAngular = () =>
  provideKeycloak({
    config: {
      url: environment.keycloakUrl,
      realm: environment.keycloakRealm,
      clientId: environment.keycloakClientId
    },
    initOptions: {
      onLoad: 'login-required',
      checkLoginIframe: false, // Disable iframe checks if not needed,
      redirectUri: 'https://idpay.itn.internal.dev.cstar.pagopa.it/portale-web-io/'
    },
    features: [
      withAutoRefreshToken({
        onInactivityTimeout: 'logout',
        sessionTimeout: 300000
      })
    ],
    providers: [
      AutoRefreshTokenService,
      UserActivityService,
      {
        provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
        useValue: [urlCondition]
      }
    ]
  });
