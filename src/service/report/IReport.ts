export interface IReport<T> {
  data: T[];
  locations: { id: number; name: string }[];
  build(): string;
}
