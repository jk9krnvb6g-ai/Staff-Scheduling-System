import { EventItem } from '../data/mockEvents';

export interface SelectedDate {
  day: number;
  month: number; // 0-11
  year: number;  // Buddhist Year (e.g., 2569) or Gregorian
  selectedEventId?: string;
}

const thaiMonthLong = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export function getThaiMonthName(monthIndex: number): string {
  return thaiMonthLong[monthIndex] || '';
}

/**
 * Returns the Gregorian year from a given year which could be Buddhist (e.g. 2569) or Gregorian (e.g. 2026).
 */
export function getGregorianYear(year: number): number {
  return year > 2500 ? year - 543 : year;
}

/**
 * Returns the Buddhist year from a Gregorian year.
 */
export function getBuddhistYear(year: number): number {
  return year < 2500 ? year + 543 : year;
}

/**
 * Checks if a given day/month/year is a holiday (weekend or Thai official holiday).
 * month is 0-indexed.
 */
export function isDayHoliday(day: number, month: number, year: number): boolean {
  const gYear = getGregorianYear(year);
  const cellDate = new Date(gYear, month, day);
  const dayOfWeek = cellDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekends are holidays
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // Specific public holidays (standard Thai holidays)
  const isPublicHoliday = 
    (month === 0 && day === 1) || // New Year's Day
    (month === 3 && [6, 13, 14, 15].includes(day)) || // April: 6 (Chakri), 13-15 (Songkran)
    (month === 4 && day === 1) || // May: 1 (National Labour Day)
    (month === 4 && day === 4) || // May: 4 (Coronation Day)
    (month === 5 && day === 3) || // June: 3 (Queen Suthida Birthday)
    (month === 6 && day === 28) || // July: 28 (King Vajiralongkorn Birthday)
    (month === 7 && day === 12) || // August: 12 (Queen Mother Birthday / Mother's Day)
    (month === 9 && day === 13) || // October: 13 (King Bhumibol Memorial Day)
    (month === 9 && day === 23) || // October: 23 (Chulalongkorn Day)
    (month === 11 && [5, 10, 31].includes(day)); // December: 5 (Father's Day), 10 (Constitution Day), 31 (New Year's Eve)

  return isPublicHoliday;
}

/**
 * Returns the name of a public holiday or weekend if it is a holiday.
 */
export function getHolidayName(day: number, month: number, year: number): string | null {
  const gYear = getGregorianYear(year);
  const cellDate = new Date(gYear, month, day);
  const dayOfWeek = cellDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Specific public holidays (standard Thai holidays)
  if (month === 0 && day === 1) return 'วันขึ้นปีใหม่';
  if (month === 3 && day === 6) return 'วันจักรี';
  if (month === 3 && [13, 14, 15].includes(day)) return 'เทศกาลวันสงกรานต์';
  if (month === 4 && day === 1) return 'วันแรงงานแห่งชาติ';
  if (month === 4 && day === 4) return 'วันฉัตรมงคล';
  if (month === 5 && day === 3) return 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี';
  if (month === 6 && day === 28) return 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว';
  if (month === 7 && day === 12) return 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง / วันแม่แห่งชาติ';
  if (month === 9 && day === 13) return 'วันนวมินทรมหาราช (วันคล้ายวันสวรรคต ร.9)';
  if (month === 9 && day === 23) return 'วันปิยมหาราช';
  if (month === 11 && day === 5) return 'วันคล้ายวันพระบรมราชสมภพ ร.9 / วันพ่อแห่งชาติ';
  if (month === 11 && day === 10) return 'วันรัฐธรรมนูญ';
  if (month === 11 && day === 31) return 'วันสิ้นปี';

  // Weekends are holidays
  if (dayOfWeek === 0) return 'วันอาทิตย์ (วันหยุดสุดสัปดาห์)';
  if (dayOfWeek === 6) return 'วันเสาร์ (วันหยุดสุดสัปดาห์)';

  return null;
}

/**
 * Safely resolves events for a specific date from the event map.
 * Supports legacy number keys (mapping to April 2569 / 2026) and formatted YYYY-MM-DD keys.
 */
export function getEventsForDate(
  eventsMap: Record<string | number, EventItem[]>,
  day: number,
  month: number,
  year: number
): EventItem[] {
  const gYear = getGregorianYear(year);
  const pad = (n: number) => String(n).padStart(2, '0');
  
  // Format keys: e.g., "2026-04-17"
  const dateKey = `${gYear}-${pad(month + 1)}-${pad(day)}`;
  
  if (eventsMap[dateKey]) {
    return eventsMap[dateKey];
  }

  // Fallback for April 2026 (legacy mode)
  if (gYear === 2026 && month === 3) {
    if (eventsMap[day]) {
      return eventsMap[day];
    }
  }

  return [];
}
