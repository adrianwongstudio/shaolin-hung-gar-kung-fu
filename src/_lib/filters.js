function telHref(phone) {
  return typeof phone === "string" ? "tel:" + phone.replace(/[^\d+]/g, "") : "";
}

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// timeZone: "UTC" avoids the classic off-by-one-day bug for date-only values
// (e.g. "2026-01-05" parses as UTC midnight; a local-timezone formatter west
// of UTC would otherwise render it as the day before).
function readableDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function limit(arr, n) {
  return (arr || []).slice(0, n);
}

function firstPageOnly(arr) {
  return (arr || []).filter((item) => item.pageNumber === 0);
}

function uniqueBy(arr, key) {
  const seen = new Set();
  return (arr || []).filter((item) => {
    const v = item[key];
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

module.exports = { telHref, isoDate, readableDate, limit, firstPageOnly, uniqueBy };
