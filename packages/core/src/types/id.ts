import { nanoid } from "nanoid";

export enum IdType {
  User = 0,
  Chat,
  ChatMessage,
  Citation,
  Document,
  DocumentChunk,
  DocumentCollection,
  DocumentToCollection,
  DocumentToDataSource,
  Organization,
  OrgMembership,
  DataSourceConnection,
  OrgDataSourceOAuthCredential,
}

export class Id<T extends IdType> {
  private _id: string;

  private constructor(v: string) {
    this._id = v;
  }

  public toString(): string {
    return this._id;
  }

  public equals<O extends IdType>(other: Id<O>): boolean {
    return this.toString() === other.toString();
  }

  static generate<T extends IdType>(): Id<T> {
    return new Id<T>(nanoid());
  }

  static from<T extends IdType>(s: string): Id<T> {
    return new Id<T>(s);
  }
}
