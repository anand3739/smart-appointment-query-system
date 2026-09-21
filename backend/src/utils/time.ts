export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isTimeOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

export function isDateOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
  breakStart?: string | null,
  breakEnd?: string | null
): string[] {
  const openM = timeToMinutes(openTime);
  const closeM = timeToMinutes(closeTime);
  const breakStartM = breakStart ? timeToMinutes(breakStart) : null;
  const breakEndM = breakEnd ? timeToMinutes(breakEnd) : null;

  const slots: string[] = [];
  let currentM = openM;

  while (currentM + durationMinutes <= closeM) {
    const slotEndM = currentM + durationMinutes;

    // Check break overlap
    let overlapsBreak = false;
    if (breakStartM !== null && breakEndM !== null) {
      if (isTimeOverlapping(currentM, slotEndM, breakStartM, breakEndM)) {
        overlapsBreak = true;
      }
    }

    if (!overlapsBreak) {
      slots.push(minutesToTime(currentM));
    }

    currentM += durationMinutes;
  }

  return slots;
}
