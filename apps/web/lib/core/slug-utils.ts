import slugify from "slugify";

export function slugFrom(s: string): string {
  return slugify(s, {
    lower: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });
}
