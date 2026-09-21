import React, { useEffect, useState } from 'react';
import { waitlistService } from '../../services/waitlist.service';
import { WaitlistEntry } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ListOrdered, Calendar, Clock, CheckCircle2, X } from 'lucide-react';

export const WaitlistPage: React.FC = () => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadWaitlist = async () => {
    try {
      const list = await waitlistService.getMyWaitlist();
      setWaitlist(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const res = await waitlistService.acceptOffer(id);
      setActionSuccess(res.message);
      await loadWaitlist();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLeave = async (id: string) => {
    try {
      await waitlistService.leaveWaitlist(id);
      await loadWaitlist();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <Spinner size="lg" className="py-24" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Waiting List</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track entries for fully-booked days. When a slot is freed, you'll receive an auto-allocation offer.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="space-y-4">
        {waitlist.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-slate-400 text-sm">
              <ListOrdered className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              You are not on any waiting lists.
            </div>
          </Card>
        ) : (
          waitlist.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-base text-slate-900">
                      {item.service?.name}
                    </span>
                    <Badge variant={item.status === 'OFFERED' ? 'green' : 'slate'}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      Preferred Date: {new Date(item.preferredDate).toLocaleDateString()}
                    </span>
                    <span>{item.branch?.name}</span>
                  </div>
                  {item.status === 'OFFERED' && item.offeredSlot && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-medium">
                      🎉 Slot Available at {new Date(item.offeredSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}! Accept within 30 minutes to confirm your booking.
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {item.status === 'OFFERED' && (
                    <Button size="sm" onClick={() => handleAccept(item.id)}>
                      Accept Slot Offer
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleLeave(item.id)}
                  >
                    Leave
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
