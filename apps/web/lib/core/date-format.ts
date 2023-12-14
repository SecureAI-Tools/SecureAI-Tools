import moment from "moment";

const DATE_FORMAT = "D MMM, YYYY";

export function formatDateTime(timeMS: number): string {
  const d = new Date(timeMS);
  const m = moment(d).local();
  return m.format(DATE_FORMAT);
}
