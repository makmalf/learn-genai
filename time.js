import moment from "moment-timezone";

export function timezone(zone, zoneCode) {
  console.log({
    zone: zone,
    code: zoneCode
  })
  if (zoneCode) {
    const now = `${moment().tz(zoneCode).format('HH:mm')} in ${zone}, I have to give some recommendations about activities to do during this time in this city`
    return now;
  }
  return null;
}