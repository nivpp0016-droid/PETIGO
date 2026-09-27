/**
 * Indian Standard Time (IST - UTC+05:30) Time Utilities
 * Provides consistent, accurate formatting for PETIGO Smart Parcel Box
 */

/**
 * Parses any database timestamp (ISO-8601, SQLite UTC datetime string,
 * Date object, or timestamp number) into a valid UTC Date instance.
 */
export function parseDate(timestamp) {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;

  if (typeof timestamp === "string") {
    let clean = timestamp.trim();
    // If it looks like SQLite CURRENT_TIMESTAMP: "YYYY-MM-DD HH:MM:SS" (UTC without timezone)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(clean)) {
      clean = clean.replace(" ", "T") + "Z";
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(clean)) {
      clean = clean + "Z";
    }
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a timestamp into an IST time string:
 * e.g. "01:23:45 PM IST" or "01:23 PM IST"
 */
export function formatISTTime(timestamp, options = {}) {
  const d = parseDate(timestamp);
  if (!d) return "Just now";

  const {
    includeSeconds = true,
    includeZone = true,
    hour12 = true
  } = options;

  const timeStr = d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12
  });

  return includeZone ? `${timeStr} IST` : timeStr;
}

/**
 * Formats a timestamp into an IST date string:
 * e.g. "Sunday, 27 Sep 2026" or "27 Sep 2026"
 */
export function formatISTDate(timestamp, options = {}) {
  const d = parseDate(timestamp);
  if (!d) return "";

  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: options.weekday,
    month: options.month || "short",
    day: options.day || "numeric",
    year: options.year !== undefined ? options.year : "numeric"
  });
}

/**
 * Formats a timestamp into a combined IST date and time string:
 * e.g. "27 Sep, 01:23 PM IST" or "27 Sep 2026, 01:23 PM IST"
 */
export function formatISTDateTime(timestamp, options = {}) {
  const d = parseDate(timestamp);
  if (!d) return "Just now";

  const {
    includeYear = false,
    includeSeconds = false,
    includeZone = true,
    hour12 = true
  } = options;

  const datePart = d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {})
  });

  const timePart = d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" } : {}),
    hour12
  });

  return `${datePart}, ${timePart}${includeZone ? " IST" : ""}`;
}
