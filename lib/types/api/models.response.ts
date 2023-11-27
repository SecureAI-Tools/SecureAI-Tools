export class ModelsResponse {
  models!: Model[];
}

interface Model {
  name: string;
  size: string;
  digest: string;
}
