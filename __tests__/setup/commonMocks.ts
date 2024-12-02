import { vi } from 'vitest';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  elements: Element[];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.elements = [];
  }

  observe(target: Element) {
    if (!this.elements.includes(target)) {
      this.elements.push(target);
      this.callback(
        [
          {
            target,
            contentRect: target.getBoundingClientRect(),
            borderBoxSize: [{ blockSize: 0, inlineSize: 0 }],
            contentBoxSize: [{ blockSize: 0, inlineSize: 0 }],
            devicePixelContentBoxSize: [{ blockSize: 0, inlineSize: 0 }]
          } as ResizeObserverEntry
        ],
        this
      );
    }
  }

  unobserve(target: Element) {
    const index = this.elements.indexOf(target);
    if (index > -1) {
      this.elements.splice(index, 1);
    }
  }

  disconnect() {
    this.elements = [];
  }
}

// Define mock channel factory
const createMockChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue(null),
  unsubscribe: vi.fn().mockResolvedValue(null)
});

// Define mock client factory with extended functionality
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: null, error: null })
  },
  channel: vi.fn().mockReturnValue(createMockChannel())
});

export const setupCommonMocks = () => {
  // Mock environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

  // Mock hooks
  vi.mock('@/hooks/useSession', () => ({
    useSession: () => ({ session: null, isLoading: false })
  }));

  // Mock Supabase client
  vi.mock('@/utils/supabase/client', () => ({
    createClient: () => createMockClient()
  }));

  // Mock createBrowserClient
  vi.mock('@supabase/ssr', () => ({
    createBrowserClient: () => createMockClient()
  }));

  // Mock Chart.js components
  vi.mock('react-chartjs-2', () => ({
    Line: () => ({
      render: () => '<div data-testid="mock-line-chart">Chart Component</div>'
    }),
    Doughnut: () => ({
      render: () =>
        '<div data-testid="mock-doughnut-chart">Chart Component</div>'
    })
  }));

  vi.mock('chart.js', () => ({
    Chart: { register: vi.fn() },
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    Filler: vi.fn(),
    ArcElement: vi.fn()
  }));

  // Mock next/image
  vi.mock('next/image', () => ({
    __esModule: true,
    default: function MockImage(props: any) {
      return {
        render: () => `<img src="${props.src}" alt="${props.alt}" />`
      };
    }
  }));

  // Mock ResizeObserver
  global.ResizeObserver = MockResizeObserver as any;
  window.ResizeObserver = MockResizeObserver as any;

  // Mock window.matchMedia
  global.window.matchMedia = function (query: string) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () {
        return false;
      }
    };
  };

  // Mock Recharts
  vi.mock('recharts', () => {
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
        // Ensure children is a function and call it with a default size
        typeof children === 'function'
          ? children({ width: 800, height: 400 })
          : children
      );
    };
    ResponsiveContainer.displayName = 'ResponsiveContainer';

    return {
      ResponsiveContainer,
      LineChart: createMockComponent('line-chart'),
      Line: createMockComponent('line'),
      BarChart: createMockComponent('bar-chart'),
      Bar: createMockComponent('bar'),
      PieChart: createMockComponent('pie-chart'),
      Pie: createMockComponent('pie'),
      Cell: createMockComponent('cell'),
      XAxis: createMockComponent('x-axis'),
      YAxis: createMockComponent('y-axis'),
      CartesianGrid: createMockComponent('cartesian-grid'),
      Tooltip: createMockComponent('tooltip'),
      Legend: createMockComponent('legend')
    };
  });
};

// Add mock author data for tests
export const mockAuthor = {
  id: '1',
  name: 'John Doe',
  avatar: '/images/avatars/john-doe.jpg',
  bio: 'Test author bio',
  location: 'New York, USA',
  joinedDate: '2023-01-01',
  totalListens: 15000,
  followers: 1000,
  following: 500,
  socialLinks: {
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  works: [
    {
      id: '1',
      title: 'Test Book',
      coverImage: '/test.jpg',
      publishDate: '2024-01-01',
      publisher: 'Test Publisher',
      genre: ['Fiction'],
      description: 'Test description'
    }
  ],
  interviews: [
    {
      id: '1',
      title: 'Test Interview',
      podcastName: 'Test Podcast',
      date: '2024-01-15',
      duration: '45:00',
      listenerCount: 1500,
      episodeUrl: 'https://example.com/episode-1'
    }
  ]
};
