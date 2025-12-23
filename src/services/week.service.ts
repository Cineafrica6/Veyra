import { WeekBoundaries, WeekDay } from '../types';

/**
 * Get the week boundaries (start and end dates) for a given date
 * based on the track's configured week start day.
 *
 * @param date - The date to calculate week boundaries for
 * @param weekStartDay - The day the week starts (0=Sunday, 1=Monday, etc.)
 * @returns WeekBoundaries with start and end dates (in UTC)
 */
export const getWeekBoundaries = (
    date: Date,
    weekStartDay: WeekDay
): WeekBoundaries => {
    // Create a copy of the date in UTC
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const currentDay = d.getUTCDay(); // 0=Sunday, 1=Monday, etc.

    // Calculate days since the week start
    let daysSinceStart = currentDay - weekStartDay;
    if (daysSinceStart < 0) {
        daysSinceStart += 7;
    }

    // Calculate week start
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() - daysSinceStart);
    weekStart.setUTCHours(0, 0, 0, 0);

    // Calculate week end (7 days after start, minus 1 millisecond)
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
    weekEnd.setUTCMilliseconds(-1);

    return {
        start: weekStart,
        end: weekEnd,
    };
};

/**
 * Get the current week boundaries for a track
 */
export const getCurrentWeekBoundaries = (weekStartDay: WeekDay): WeekBoundaries => {
    return getWeekBoundaries(new Date(), weekStartDay);
};

/**
 * Check if a date is within the current week for a given week start day
 */
export const isWithinCurrentWeek = (date: Date, weekStartDay: WeekDay): boolean => {
    const { start, end } = getCurrentWeekBoundaries(weekStartDay);
    return date >= start && date <= end;
};

/**
 * Get week boundaries for previous weeks
 */
export const getPastWeekBoundaries = (
    weekStartDay: WeekDay,
    weeksAgo: number
): WeekBoundaries => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() - weeksAgo * 7);
    return getWeekBoundaries(now, weekStartDay);
};

/**
 * Format a date range for display
 */
export const formatWeekRange = (start: Date, end: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
    };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    return `${startStr} - ${endStr}`;
};

/**
 * Get the day name for a week day number
 */
export const getDayName = (weekDay: WeekDay): string => {
    const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];
    return days[weekDay];
};
