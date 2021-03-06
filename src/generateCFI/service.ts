import { Callback, CallSource, EventListenerService } from '@readium/glue-shared';
import { IAddEventListenerOptions } from '../eventHandling/interface';
import { CFIEventHandlingMessage } from './interface';
import { RangeData, createRangeFromRangeData } from '../utilities/rangeUtils';
import { createCFIFromRange } from '../utilities/helpers';

export class GenerateCFIService extends EventListenerService {
  constructor(source: CallSource) {
    super(source);
    source.bind(CFIEventHandlingMessage.FromRange, this._fromRangeData);
  }

  private async _fromRangeData(
    callback: Callback,
    rangeData: RangeData,
    options: IAddEventListenerOptions,
  ): Promise<void> {
    const range = createRangeFromRangeData(rangeData);

    const cfi = createCFIFromRange(range);

    return callback(cfi);
  }
}
