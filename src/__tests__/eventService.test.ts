import { describe, it, expect } from 'vitest';
import { eventService } from '@/lib/events';

describe('eventService', () => {
  it('getEventById returns event when found', async () => {
    const ev = await eventService.getEventById('test-event-1');
    expect(ev).toBeTruthy();
    expect(ev?.id).toBe('test-event-1');
  });
});
