import { Caller } from '@readium/glue-rpc';
import { ITextNodeOptions, ElementInfoEventHandlingMessage } from './interface';
import { RangeData } from '../utilities/rangeUtils';

export class ElementInfo extends Caller {
  public constructor(targetWindow: Window) {
    super('elementInfo', targetWindow);
  }

  public async getNextTextNodeCFI(
    rangeDataOrCFI: RangeData | string,
    listener: EventListener,
    options: ITextNodeOptions = {},
  ): Promise<string> {
    return this.call(
      ElementInfoEventHandlingMessage.GetNextTextNodeCFI,
      [rangeDataOrCFI, options],
      (event) => {
        listener(event[0]);
      },
    );
  }

  public async getNextTextNodeRangeData(
    rangeDataOrCFI: RangeData | string,
    listener: EventListener,
    options: ITextNodeOptions = {},
  ): Promise<string> {
    return this.call(
      ElementInfoEventHandlingMessage.GetNextTextNodeRangeData,
      [rangeDataOrCFI, options],
      (event) => {
        listener(event[0]);
      },
    );
  }

  public async getWordCFI(
    rangeDataOrCFI: RangeData | string,
    listener: EventListener,
    options: ITextNodeOptions = {},
  ): Promise<string> {
    return this.call(
      ElementInfoEventHandlingMessage.GetWordCFI,
      [rangeDataOrCFI, options],
      (event) => {
        listener(event[0]);
      },
    );
  }

  public async getWordRangeData(
    rangeDataOrCFI: RangeData | string,
    listener: EventListener,
    options: ITextNodeOptions = {},
  ): Promise<string> {
    return this.call(
      ElementInfoEventHandlingMessage.GetWordRangeData,
      [rangeDataOrCFI, options],
      (event) => {
        listener(event[0]);
      },
    );
  }
}
