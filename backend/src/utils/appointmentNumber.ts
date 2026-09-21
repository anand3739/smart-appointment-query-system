export function generateAppointmentNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `APT-${year}-${randomNum}`;
}

export function generateQueueNumber(priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY', countToday: number): string {
  let prefix = 'A';
  if (priority === 'EMERGENCY') prefix = 'E';
  if (priority === 'PRIORITY') prefix = 'P';
  const sequence = String(countToday + 1).padStart(3, '0');
  return `${prefix}-${sequence}`;
}
