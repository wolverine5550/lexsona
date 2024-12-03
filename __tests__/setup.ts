import { afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Set up environment variables before any tests run
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.EMAIL_FROM_ADDRESS = 'test@example.com';
process.env.EMAIL_REPLY_TO_ADDRESS = 'reply@example.com';

// Mock environment variables using Vitest
vi.stubEnv('NEXT_PUBLIC_EMAIL_FROM_ADDRESS', 'test@example.com');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: vi.fn(),
      off: vi.fn()
    }
  })
}));

// Add type declarations
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        findChart: (
          container: HTMLElement,
          testId: string
        ) => HTMLElement | null;
        getChartData: (chart: HTMLElement | null) => any;
        triggerResize: (element: Element) => ResizeObserver;
      };
      window: Window & typeof globalThis;
    }
  }
}

// Add type for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveChartData(expected: any): R;
    }
  }
}

// Mock window and ResizeObserver before any imports
beforeAll(() => {
  // Define window if it's not defined (for jsdom)
  if (typeof window === 'undefined') {
    global.window = {} as Window & typeof globalThis;
  }

  // Mock ResizeObserver
  const ResizeObserverMock = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Define ResizeObserver on both global and window
  global.ResizeObserver = ResizeObserverMock;
  window.ResizeObserver = ResizeObserverMock;

  // Mock window.matchMedia
  global.window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true)
  }));
});

// Mock Recharts
vi.mock('recharts', async () => {
  const React = require('react');

  const createMockComponent = (testId: string) => {
    const Component = ({ children, data, ...props }: any) => {
      return React.createElement(
        'div',
        {
          'data-testid': testId,
          'data-chart-data': data ? JSON.stringify(data) : undefined,
          ...props
        },
        children
      );
    };
    Component.displayName = testId;
    return Component;
  };

  // Special handling for ResponsiveContainer
  const ResponsiveContainer = ({
    children,
    width = '100%',
    height = 400
  }: any) => {
    return React.createElement(
      'div',
      {
        'data-testid': 'responsive-container',
        style: {
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height
        }
      },
      typeof children === 'function'
        ? children({ width: 800, height: 400 })
        : children
    );
  };

  return {
    ResponsiveContainer,
    LineChart: createMockComponent('line-chart'),
    Line: createMockComponent('line'),
    BarChart: createMockComponent('bar-chart'),
    Bar: createMockComponent('bar'),
    RadarChart: createMockComponent('radar-chart'),
    Radar: createMockComponent('radar'),
    PieChart: createMockComponent('pie-chart'),
    Pie: createMockComponent('pie'),
    Cell: createMockComponent('cell'),
    PolarGrid: createMockComponent('polar-grid'),
    PolarAngleAxis: createMockComponent('polar-angle-axis'),
    PolarRadiusAxis: createMockComponent('polar-radius-axis'),
    XAxis: createMockComponent('x-axis'),
    YAxis: createMockComponent('y-axis'),
    CartesianGrid: createMockComponent('cartesian-grid'),
    Tooltip: createMockComponent('tooltip'),
    Legend: createMockComponent('legend')
  };
});

// Test utilities for analytics components
global.testUtils = {
  // Helper to find chart by test id
  findChart: (container: HTMLElement, testId: string) => {
    // First try to find the chart directly
    let chart = container.querySelector(
      `[data-testid="${testId}"]`
    ) as HTMLElement | null;
    if (!chart) {
      // If not found, try to find it within a ResponsiveContainer
      const responsiveContainer = container.querySelector(
        '[data-testid="responsive-container"]'
      );
      if (responsiveContainer) {
        chart = responsiveContainer.querySelector(
          `[data-testid="${testId}"]`
        ) as HTMLElement | null;
      }
    }
    return chart;
  },
  // Helper to get chart data
  getChartData: (chart: HTMLElement | null) => {
    if (!chart) return null;
    const dataAttr = chart.getAttribute('data-chart-data');
    return dataAttr ? JSON.parse(dataAttr) : null;
  },
  // Helper to simulate resize observer (now simplified since we don't need it)
  triggerResize: (element: Element) => {
    // Return a no-op mock since we're not actually using ResizeObserver anymore
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    } as ResizeObserver;
  }
};

// Add custom matchers
expect.extend({
  toHaveChartData(received: HTMLElement, expected: any) {
    const data = global.testUtils.getChartData(received);
    const pass = this.equals(data, expected);
    return {
      pass,
      message: () =>
        pass
          ? `expected chart not to have data ${this.utils.printExpected(expected)}`
          : `expected chart to have data ${this.utils.printExpected(expected)} but got ${this.utils.printReceived(data)}`
    };
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
