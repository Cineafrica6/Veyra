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
 * Multiplier starts at 1.0 and increases by 0.1 for each consecutive week
 * Max multiplier is 2.0 (at 10+ week streak)
 */
export function getStreakMultiplier(currentStreak: number): number {
    if (currentStreak <= 0) return 1.0;
    const multiplier = 1.0 + (currentStreak * 0.1);
    return Math.min(multiplier, 2.0); // Cap at 2x
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
