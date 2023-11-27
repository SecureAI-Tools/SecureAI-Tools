export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public info: any | undefined,
  ) {
    super(message);
  }
}
