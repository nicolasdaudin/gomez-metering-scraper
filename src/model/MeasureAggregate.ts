export interface AggregateByDayAndDevice {
  day: string;
  consumption: string;
  location: string;
  unitCost: number;
  costForTheDay: number;
  coefficient: number;
}

export interface AggregateByMonth {
  month: string;
  weightedConsumption: number;
  totalConsumption: number;
  costForTheMonth: number;
}

export const calculateByDayAndDevice = (
  data: AggregateByDayAndDevice[]
): { cost: number; consumption: number } => {
  // calculate total cost and total consumption for the day
  return data.reduce(
    (prev, curr) => ({
      cost: prev.cost + +curr.costForTheDay,
      consumption: prev.consumption + +curr.consumption,
    }),
    { cost: 0, consumption: 0 }
  );
};
