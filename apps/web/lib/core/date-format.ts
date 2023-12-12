import moment from "moment";

const DATE_FORMAT = "D MMM, YY";

export function format(d: Date | undefined | null): string | undefined {
  if (!d) {
    return undefined;
  }

  const m = moment(d).local();
  return m.format(DATE_FORMAT);
}
