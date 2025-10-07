import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

interface Stat {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: string;
}

interface DashboardWidgetsProps {
  stats: Stat[];
}

export function DashboardWidgets({ stats }: DashboardWidgetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change !== undefined && stat.change >= 0;

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>

            {stat.change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {Math.abs(stat.change).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs last period</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ChartWidgetProps {
  title: string;
  data?: Array<{ label: string; value: number }>;
  type?: 'bar' | 'line' | 'pie';
}

export function ChartWidget({ title, data = [], type = 'bar' }: ChartWidgetProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

      {data.length > 0 ? (
        <div className="space-y-4">
          {type === 'bar' && (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-800 h-2 rounded-full transition-all"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'line' && (
            <div className="h-48 flex items-end justify-between gap-2">
              {data.map((item, index) => {
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-red-800 rounded-t" style={{ height: `${height}%` }} />
                    <span className="text-xs text-gray-600 text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {type === 'pie' && (
            <div className="space-y-2">
              {data.map((item, index) => {
                const percentage = ((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
                const colors = ['bg-red-800', 'bg-amber-500', 'bg-green-600', 'bg-blue-600', 'bg-purple-600'];
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                    <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No data available</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickStatsProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

export function QuickStats({ label, value, subtext, color = 'text-gray-900' }: QuickStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}
