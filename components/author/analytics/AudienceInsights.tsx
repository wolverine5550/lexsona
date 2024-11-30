import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Globe2, Clock, Users } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Mock data - Replace with actual API data
const demographicData = {
  labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
  datasets: [
    {
      data: [15, 30, 25, 20, 10],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)', // blue-500
        'rgba(99, 102, 241, 0.8)', // indigo-500
        'rgba(139, 92, 246, 0.8)', // purple-500
        'rgba(168, 85, 247, 0.8)', // violet-500
        'rgba(217, 70, 239, 0.8)' // fuchsia-500
      ],
      borderWidth: 0
    }
  ]
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    }
  },
  cutout: '60%'
};

const AudienceInsights = () => {
  // Mock engagement metrics
  const metrics = [
    {
      icon: Clock,
      label: 'Avg. Session Duration',
      value: '12m 30s',
      change: '+5.2%'
    },
    {
      icon: Users,
      label: 'Return Listeners',
      value: '68%',
      change: '+2.1%'
    },
    {
      icon: Globe2,
      label: 'Top Location',
      value: 'United States',
      change: '45% of total'
    }
  ];

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-6"
      data-testid="insights-container"
    >
      <h2 className="text-lg font-semibold mb-6">Audience Insights</h2>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        data-testid="demographics-grid"
      >
        {/* Demographics Chart */}
        <div data-testid="section-demographics">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Age Distribution
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut data={demographicData} options={chartOptions} />
          </div>
        </div>

        {/* Engagement Metrics */}
        <div data-testid="section-metrics">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Engagement Metrics
          </h3>
          <div className="space-y-6">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div
                  className="p-2 bg-blue-100 rounded-lg"
                  data-testid={`metric-icon-${metric.label}`}
                >
                  <metric.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p
                    className="text-sm text-gray-600"
                    data-testid={`metric-label-${metric.label}`}
                  >
                    {metric.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg font-semibold"
                      data-testid={`metric-value-${metric.label}`}
                    >
                      {metric.value}
                    </span>
                    <span className="text-sm text-green-600">
                      {metric.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudienceInsights;
