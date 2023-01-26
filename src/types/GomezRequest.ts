// // to be used like this: req: Request & NbOfDaysParam
// interface NbOfDaysParam {
//   params: {
//     nbOfDaysToExtract: string;
//   };
// }

import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface TypedRequestParam<T extends ParamsDictionary> extends Request {
  params: T;
}
