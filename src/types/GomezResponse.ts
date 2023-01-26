import { Response } from 'express';
import { Send } from 'express-serve-static-core';

interface GomezAggregateBase {
  totalConsumption: number;
}
interface GomezAggregateLocation {
  location: string;
}
interface GomezAggregateDay {
  day: string;
}
interface GomezAggregateMonth {
  month: string;
}

export interface GomezAggregateByMonthAndDevice {
  data: (GomezAggregateBase & GomezAggregateLocation & GomezAggregateMonth)[];
}

export interface GomezAggregateByMonth {
  data: (GomezAggregateBase & GomezAggregateMonth)[];
}

export interface GomezAggregateByDay {
  data: (GomezAggregateBase & GomezAggregateDay)[];
}

export interface TypedResponse<T> extends Response {
  json: Send<T, this>;
}
