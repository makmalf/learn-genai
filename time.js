import moment from "moment";

export function timezone(zone) {
  const zones = ['jakarta', 'bandung', 'jogjakarta', 'surabaya']
  if (zones.includes(zone.toLowerCase())) {
    const now = moment()
    return now;
  }
  return null
}