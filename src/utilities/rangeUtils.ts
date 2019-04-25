import * as EPUBcfi from 'readium-cfi-js';
import { getElementPath, getElementFromStringArray, getTextSelector } from './helpers';
import { marshalObject } from '@readium/glue-rpc/lib/marshaling';

export interface RangeData {
  startOffset: number;
  startContainer: any[];
  endOffset: number;
  endContainer: any[];
  collapsed: boolean;
}

export function createRangeData(range: Range): RangeData {
  const startContainerPath = getElementPath(range.startContainer);
  const endContainerPath = getElementPath(range.endContainer);

  const rangeData: RangeData = {
    startOffset: range.startOffset,
    startContainer: startContainerPath,
    endOffset: range.endOffset,
    endContainer: endContainerPath,
    collapsed: range.collapsed,
  };

  return rangeData;
}

// Turn rangeData into an object that can be transfered to another document
export function createMarshaledRangeData(rangeData: RangeData): any {
  const startTextNode = pluckTextFromElementArray(rangeData.startContainer);
  const endTextNode = pluckTextFromElementArray(rangeData.endContainer);
  const marshaledRangeData = marshalObject(rangeData);
  if (startTextNode) {
    marshaledRangeData.startContainer.push(getTextSelector(startTextNode));
  }
  if (endTextNode) {
    marshaledRangeData.endContainer.push(getTextSelector(endTextNode));
  }

  return marshaledRangeData;
}

export function createRangeFromRangeData(rangeData: RangeData): Range {
  const startElement = getElementFromStringArray(rangeData.startContainer);
  const endElement = getElementFromStringArray(rangeData.endContainer);

  if (!startElement || !endElement) {
    console.error('Element was not successfully retrieved from rangeData');

    return new Range();
  }

  return createRange(startElement, rangeData.startOffset, endElement, rangeData.endOffset);
}

export function createRange(
  startContainer: Node,
  startOffset: number,
  endContainer: Node,
  endOffset: number,
): Range {
  const range = new Range();

  const position = startContainer.compareDocumentPosition(endContainer);
  let isBackwards = false;
  if (position === 0) {
    isBackwards = startOffset > endOffset;
  }
  if (position === startContainer.DOCUMENT_POSITION_PRECEDING) {
    isBackwards = true;
  }

  const sc = isBackwards ? endContainer : startContainer;
  const so = isBackwards ? endOffset : startOffset;
  const ec = isBackwards ? startContainer : endContainer;
  const eo = isBackwards ? startOffset : endOffset;

  range.setStart(sc, so);
  range.setEnd(ec, eo);

  return range;
}

export function createRangeFromCFI(cfiParam: string): Range | null {
  let range;
  let cfi = cfiParam;
  if (!cfi.includes('epubcfi')) {
    cfi = `epubcfi(/99!${cfi})`;
  }

  if (EPUBcfi.Interpreter.isRangeCfi(cfi)) {
    const target = EPUBcfi.Interpreter.getRangeTargetElements(cfi, document);
    range = createRange(
      target.startElement,
      target.startOffset || 0,
      target.endElement,
      target.endOffset || 0,
    );
  } else {
    const target = EPUBcfi.Interpreter.getTargetElement(cfi, document);
    // Return a collapsed range
    return createRange(target[0], 0, target[0], 0);
  }

  return range || null;
}

export function pluckTextFromElementArray(elements: Element[]): Text | null {
  let text = null;
  elements.forEach((element: Element, index: number) => {
    if (element.nodeType === Node.TEXT_NODE) {
      text = elements.splice(index, 1)[0];
    }
  });

  return text;
}
