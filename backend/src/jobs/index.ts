import { dbStore } from '../config/dataStore';
import { notificationRepo } from '../repositories';
import { emitNotification } from '../realtime/events';

export function startBackgroundJobs() {
  console.log(' Starting background workers for reservation expiration & appointment reminders...');

  // 1. Expired reservation sweeper - runs every 60 seconds
  setInterval(async () => {
    const now = Date.now();
    const expired = dbStore.temporaryReservations.filter(
      (r) => new Date(r.expiresAt).getTime() <= now
    );
    if (expired.length > 0) {
      dbStore.temporaryReservations = dbStore.temporaryReservations.filter(
        (r) => new Date(r.expiresAt).getTime() > now
      );
    }
  }, 60000);

  // 2. Appointment reminders - runs every 5 minutes
  setInterval(async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const appt of dbStore.appointments) {
      if (appt.status === 'CONFIRMED') {
        const start = new Date(appt.startTime);
        // If appointment is within 24 hours and hasn't been reminded yet
        const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0 && diffHours <= 24 && !appt._reminded) {
          appt._reminded = true;
          const notif = await notificationRepo.create({
            userId: appt.customerId,
            type: 'BOOKING_REMINDER',
            title: 'Upcoming Appointment Reminder',
            message: `Reminder: You have an appointment scheduled for tomorrow at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            data: { appointmentId: appt.id },
          });
          emitNotification(appt.customerId, notif);
        }
      }
    }
  }, 300000);
}
