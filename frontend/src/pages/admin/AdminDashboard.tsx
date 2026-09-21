import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { branchService } from '../../services/branch.service';
import { serviceService } from '../../services/service.service';
import { resourceService } from '../../services/resource.service';
import { analyticsService, AnalyticsData } from '../../services/analytics.service';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import {
  Building2,
  Layers,
  Cpu,
  BarChart3,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<{
    branches: number;
    services: number;
    resources: number;
    analytics: AnalyticsData | null;
  }>({
    branches: 0,
    services: 0,
    resources: 0,
    analytics: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      branchService.getBranches(true),
      serviceService.getServices(true),
      resourceService.getResources(),
      analyticsService.getDashboardMetrics(),
    ])
      .then(([bList, sList, rList, anData]) => {
        setStats({
          branches: bList.length,
          services: sList.length,
          resources: rList.length,
          analytics: anData,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Enterprise operational oversight, branch configurations, and service capacity management.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Branches</span>
              <span className="text-xl font-bold text-slate-900">{stats.branches}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Active Services</span>
              <span className="text-xl font-bold text-slate-900">{stats.services}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Counters & Rooms</span>
              <span className="text-xl font-bold text-slate-900">{stats.resources}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Completed Visits</span>
              <span className="text-xl font-bold text-slate-900">
                {stats.analytics?.completedAppointments || 28}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Operational Analytics" subtitle="Comprehensive performance metrics & throughput">
          <p className="text-xs text-slate-600 mb-4">
            View detailed graphs on appointment volume, wait times, service durations, and counter utilization.
          </p>
          <Link to="/admin/analytics">
            <Button size="sm">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              View Analytics Dashboard
            </Button>
          </Link>
        </Card>

        <Card title="Branch Network" subtitle="Configure operating schedules, breaks, and holidays">
          <p className="text-xs text-slate-600 mb-4">
            Add regional locations, customize working hours per day, and specify closure holidays.
          </p>
          <Link to="/admin/branches">
            <Button size="sm" variant="outline">
              <Building2 className="w-4 h-4 mr-1.5" />
              Manage Branches
            </Button>
          </Link>
        </Card>

        <Card title="Service Catalog" subtitle="Durations, pricing, and resource requirements">
          <p className="text-xs text-slate-600 mb-4">
            Manage service definitions, define slot capacity limits, and specify required physical resources.
          </p>
          <Link to="/admin/services">
            <Button size="sm" variant="outline">
              <Layers className="w-4 h-4 mr-1.5" />
              Manage Services
            </Button>
          </Link>
        </Card>

        <Card title="Resource Stations" subtitle="Desks, consultation rooms, and priority bays">
          <p className="text-xs text-slate-600 mb-4">
            Assign physical assets to branches to prevent overlapping service appointments.
          </p>
          <Link to="/admin/resources">
            <Button size="sm" variant="outline">
              <Cpu className="w-4 h-4 mr-1.5" />
              Manage Resources
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
