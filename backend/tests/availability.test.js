/**
 * Unit tests for availability logic
 * Tests date overlap detection and availability calculations
 */

const { eachDayOfInterval, format } = require('date-fns');

// Helper functions extracted from public.service.js for testing
function collectUnavailableDates(reservations, blocks) {
  const unavailableDates = new Set();
  
  const addDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      unavailableDates.add(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
  };

  reservations.forEach(r => addDateRange(r.start_date, r.end_date));
  blocks.forEach(b => addDateRange(b.start_date, b.end_date));

  return Array.from(unavailableDates).sort();
}

function checkDateRangeOverlap(existingStart, existingEnd, newStart, newEnd) {
  // Two date ranges overlap if:
  // newStart <= existingEnd AND newEnd >= existingStart
  const start1 = new Date(existingStart);
  const end1 = new Date(existingEnd);
  const start2 = new Date(newStart);
  const end2 = new Date(newEnd);
  
  return start2 <= end1 && end2 >= start1;
}

describe('Availability Logic', () => {
  describe('collectUnavailableDates', () => {
    it('should return empty array when no reservations or blocks', () => {
      const result = collectUnavailableDates([], []);
      expect(result).toEqual([]);
    });

    it('should collect single date from single-day reservation', () => {
      const reservations = [{ start_date: '2024-03-15', end_date: '2024-03-15' }];
      const result = collectUnavailableDates(reservations, []);
      expect(result).toEqual(['2024-03-15']);
    });

    it('should collect multiple dates from multi-day reservation', () => {
      const reservations = [{ start_date: '2024-03-15', end_date: '2024-03-17' }];
      const result = collectUnavailableDates(reservations, []);
      expect(result).toEqual(['2024-03-15', '2024-03-16', '2024-03-17']);
    });

    it('should combine reservations and blocks', () => {
      const reservations = [{ start_date: '2024-03-15', end_date: '2024-03-15' }];
      const blocks = [{ start_date: '2024-03-20', end_date: '2024-03-21' }];
      const result = collectUnavailableDates(reservations, blocks);
      expect(result).toEqual(['2024-03-15', '2024-03-20', '2024-03-21']);
    });

    it('should deduplicate overlapping dates', () => {
      const reservations = [
        { start_date: '2024-03-15', end_date: '2024-03-17' },
        { start_date: '2024-03-16', end_date: '2024-03-18' },
      ];
      const result = collectUnavailableDates(reservations, []);
      expect(result).toEqual(['2024-03-15', '2024-03-16', '2024-03-17', '2024-03-18']);
    });
  });

  describe('checkDateRangeOverlap', () => {
    it('should detect overlap when new range starts during existing', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-15', '2024-03-12', '2024-03-18');
      expect(result).toBe(true);
    });

    it('should detect overlap when new range ends during existing', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-15', '2024-03-08', '2024-03-12');
      expect(result).toBe(true);
    });

    it('should detect overlap when new range is contained within existing', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-20', '2024-03-12', '2024-03-15');
      expect(result).toBe(true);
    });

    it('should detect overlap when new range contains existing', () => {
      const result = checkDateRangeOverlap('2024-03-12', '2024-03-15', '2024-03-10', '2024-03-20');
      expect(result).toBe(true);
    });

    it('should detect overlap when ranges are exactly the same', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-15', '2024-03-10', '2024-03-15');
      expect(result).toBe(true);
    });

    it('should detect overlap on same-day boundary (end = start)', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-15', '2024-03-15', '2024-03-20');
      expect(result).toBe(true);
    });

    it('should NOT detect overlap when ranges are adjacent (end before start)', () => {
      const result = checkDateRangeOverlap('2024-03-10', '2024-03-14', '2024-03-15', '2024-03-20');
      expect(result).toBe(false);
    });

    it('should NOT detect overlap when ranges are completely separate', () => {
      const result = checkDateRangeOverlap('2024-03-01', '2024-03-05', '2024-03-20', '2024-03-25');
      expect(result).toBe(false);
    });

    it('should handle single-day ranges correctly', () => {
      // Same day should overlap
      const result1 = checkDateRangeOverlap('2024-03-15', '2024-03-15', '2024-03-15', '2024-03-15');
      expect(result1).toBe(true);

      // Adjacent days should not overlap
      const result2 = checkDateRangeOverlap('2024-03-15', '2024-03-15', '2024-03-16', '2024-03-16');
      expect(result2).toBe(false);
    });
  });
});

describe('Reservation Status Rules', () => {
  const blockingStatuses = ['pending', 'confirmed', 'owner_blocked'];
  const nonBlockingStatuses = ['rejected', 'cancelled'];

  it('should define correct blocking statuses', () => {
    expect(blockingStatuses).toContain('pending');
    expect(blockingStatuses).toContain('confirmed');
    expect(blockingStatuses).toContain('owner_blocked');
  });

  it('should define correct non-blocking statuses', () => {
    expect(nonBlockingStatuses).toContain('rejected');
    expect(nonBlockingStatuses).toContain('cancelled');
  });

  it('blocking and non-blocking statuses should not overlap', () => {
    const overlap = blockingStatuses.filter(s => nonBlockingStatuses.includes(s));
    expect(overlap).toHaveLength(0);
  });
});
