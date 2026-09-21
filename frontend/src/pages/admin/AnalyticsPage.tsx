import React, { useEffect, useState } from 'react';
import { analyticsService, AnalyticsData } from '../../services/analytics.service';
import { branchService } from '../../services/branch.service';
import { Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  CalendarCheck,
  Clock,
  UserX,
  XCircle,
  TrendingUp,
  Activity,
  Layers,
  Cpu,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const [anData, bList] = await Promise.all([
        analyticsService.getDashboardMetrics({ branchId: selectedBranchId || undefined }),
        branchService.getBranches(),
      ]);
      setData(anData);
      setBranches(bList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedBranchId]);

  if (isLoading || !data) return <Spinner size="lg" className="py-24" />;

  const cancellationRate = data.totalBookings
    ? Math.round((data.cancellations / data.totalBookings) * 100)
    : 0;

  const noShowRate = data.totalBookings
    ? Math.round((data.noShows / data.totalBookings) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operational Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time throughput metrics, wait times, service durations, and branch capacity performance.
          </p>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Filter:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Consolidated (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Total Volume</span>
              <span className="text-2xl font-bold text-slate-900">{data.totalBookings}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Avg Wait Time</span>
              <span className="text-2xl font-bold text-slate-900">{data.averageWaitTimeMinutes}m</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Avg Service Time</span>
              <span className="text-2xl font-bold text-slate-900">{data.averageServiceDurationMinutes}m</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Cancel / No-Show Rate</span>
              <span className="text-2xl font-bold text-slate-900">{cancellationRate + noShowRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Throughput Chart */}
        <Card title="Daily Booking Volume & Walk-Ins" subtitle="Last 7 days throughput comparison">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Legend />
                <Bar dataKey="bookings" fill="#4f46e5" name="Appointments" radius={[4, 4, 0, 0]} />
                <Bar dataKey="walkins" fill="#818cf8" name="Walk-Ins" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Popular Services Chart */}
        <Card title="Popular Service Distribution" subtitle="Bookings and walk-ins by service category">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.popularServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  dataKey="serviceName"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={140}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" name="Completed Visits" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Branch Performance Comparison */}
        <Card title="Branch Network Performance" subtitle="Total vs completed appointments">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="branchName" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Total Scheduled" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completedCount" fill="#22c55e" name="Successfully Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Resource Utilization */}
        <Card title="Resource Station Utilization" subtitle="Average daily operating hours per station">
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resourceUtilization}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="resourceName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Bar dataKey="usageHours" fill="#8b5cf6" name="Active Hours" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
