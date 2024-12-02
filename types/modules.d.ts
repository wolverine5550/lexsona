interface TestUtils {
  findChart: (container: HTMLElement, testId: string) => HTMLElement | null;
  getChartData: (chart: HTMLElement | null) => any;
  triggerResize: (element: Element) => ResizeObserver;
}

declare global {
  var testUtils: TestUtils;

  namespace Vi {
    interface Assertion {
      toHaveChartData(expected: any): void;
    }
    interface AsymmetricMatchersContaining {
      toHaveChartData(expected: any): void;
    }
  }
}

export {};
