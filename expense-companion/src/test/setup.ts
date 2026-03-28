import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Mock Keycloak before any tests run
vi.mock('@/config/keycloak', () => ({
  default: {
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn(),
    logout: vi.fn(),
    updateToken: vi.fn().mockResolvedValue(true),
    token: 'mock-token',
    tokenParsed: {
      preferred_username: 'testuser',
      email: 'test@example.com',
    },
  },
}));

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Keep DOM event constructors aligned with JSDOM's window instance.
// Radix FocusScope dispatches CustomEvent instances during mount/unmount,
// and Vitest can otherwise pick up Node's global constructors, which JSDOM
// does not accept in dispatchEvent.
globalThis.Event = window.Event;
globalThis.CustomEvent = window.CustomEvent;

// Mock ResizeObserver for components that use it (like cmdk)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver for infinite scroll components
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
};

// Mock scrollIntoView for components that use it (like cmdk)
Element.prototype.scrollIntoView = vi.fn();
