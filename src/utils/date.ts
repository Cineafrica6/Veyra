/**
 * Get the start and end of the week for a given date
 * @param date The date to get week boundaries for
 * @param weekStartDay The day the week starts (0 = Sunday, 1 = Monday, etc.)
 */
export function getWeekBoundaries(date: Date, weekStartDay: number = 1): {
    weekStart: Date;
    weekEnd: Date;
} {
    const d = new Date(date);
    const currentDay = d.getDay();

    // Calculate days to subtract to get to week start
    let daysToSubtract = currentDay - weekStartDay;
    if (daysToSubtract < 0) {
        daysToSubtract += 7;
    }

    // Week start at midnight
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);

    // Week end at 23:59:59.999
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
}

/**
 * Calculate streak multiplier based on current streak
 * Multiplier is 1.12x per consecutive day
 * Formula: 1.0 + (streak_days * 0.12)
 * Max multiplier is 3.0 (at ~17 day streak)
 */
export function getStreakMultiplier(currentStreak: number): number {
    if (currentStreak <= 0) return 1.0;
    const multiplier = 1.0 + (currentStreak * 0.12);
    return Math.min(multiplier, 3.0); // Cap at 3x
}

/**
 * Check if a date is yesterday relative to another date
 */
export function isYesterday(lastDate: Date | undefined, currentDate: Date): boolean {
    if (!lastDate) return false;

    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const lastDateStart = new Date(lastDate);
    lastDateStart.setHours(0, 0, 0, 0);

    return lastDateStart.getTime() === yesterday.getTime();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | undefined, date2: Date): boolean {
    if (!date1) return false;

    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);

    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() === d2.getTime();
}

/**
 * Check if a date falls within the previous week of the reference date
 */
export function isPreviousWeek(
    lastWeekStart: Date | undefined,
    currentWeekStart: Date,
    weekStartDay: number
): boolean {
    if (!lastWeekStart) return false;

    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    return lastWeekStart.getTime() === prevWeekStart.getTime();
}
