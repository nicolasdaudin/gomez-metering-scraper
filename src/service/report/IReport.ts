export interface IReport<T> {
  data: T[];
  build(): string;
}
