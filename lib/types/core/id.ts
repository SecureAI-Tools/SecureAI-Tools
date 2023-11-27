import { nanoid } from "nanoid";

export class Id<T> {
  private _id: string;

  private constructor(v: string) {
    this._id = v;
  }

  public toString(): string {
    return this._id;
  }

  public equals<O>(other: Id<O>): boolean {
    return this.toString() === other.toString();
  }

  static generate<T>(ctor: new () => T): Id<T> {
    return new Id<T>(nanoid());
  }

  static from<T>(s: string): Id<T> {
    return new Id<T>(s);
  }
}
