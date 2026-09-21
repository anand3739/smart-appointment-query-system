import React, { useEffect, useState } from 'react';
import { serviceService } from '../../services/service.service';
import { Service } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Layers, Plus, DollarSign, Clock, Users, Cpu } from 'lucide-react';

export const ServiceManagementPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [price, setPrice] = useState('50.00');
  const [capacityPerSlot, setCapacityPerSlot] = useState('1');
  const [requiredResourceType, setRequiredResourceType] = useState('DESK');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = async () => {
    try {
      const list = await serviceService.getServices(true);
      setServices(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await serviceService.createService({
        name,
        description,
        durationMinutes: parseInt(durationMinutes, 10),
        price: parseFloat(price),
        capacityPerSlot: parseInt(capacityPerSlot, 10),
        requiredResourceType: requiredResourceType || undefined,
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      await loadServices();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (s: Service) => {
    try {
      await serviceService.updateService(s.id, { isActive: !s.isActive });
      await loadServices();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage offered service tiers, pricing, slot duration, capacity quotas, and assigned resource types.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                  <Badge variant={s.isActive ? 'green' : 'slate'}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">{s.description}</p>
              </div>
              <button
                onClick={() => handleToggle(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                  s.isActive ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {s.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                <span className="font-semibold text-slate-800">{s.durationMinutes} mins</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Price</span>
                <span className="font-semibold text-slate-800">${s.price}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
                <span className="font-semibold text-slate-800">{s.capacityPerSlot} per slot</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Resource</span>
                <span className="font-semibold text-indigo-600">{s.requiredResourceType || 'ANY'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Service Tier"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Service Name"
            required
            placeholder="e.g. VIP Concierge Consultation"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            required
            placeholder="e.g. Dedicated one-on-one session"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min="5"
              step="5"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
            <Input
              label="Price ($)"
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity per Slot"
              type="number"
              min="1"
              required
              value={capacityPerSlot}
              onChange={(e) => setCapacityPerSlot(e.target.value)}
              helperText="Parallel customers per time slot"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Required Resource
              </label>
              <select
                value={requiredResourceType}
                onChange={(e) => setRequiredResourceType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="DESK">DESK (Consultation Desk)</option>
                <option value="COUNTER">COUNTER (Service Counter)</option>
                <option value="ROOM">ROOM (Diagnostic Suite / Office)</option>
                <option value="BAY">BAY (Clearance Bay)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Service Tier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
