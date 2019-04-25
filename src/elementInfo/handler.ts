import { Callback, CallSource } from '@readium/glue-rpc';
import { ElementInfoEventHandlingMessage, ITextNodeOptions } from './interface';
import {
  RangeData,
  createRangeFromCFI,
  createRangeFromRangeData,
  createRange,
  createRangeData,
  createMarshaledRangeData,
} from '../utilities/rangeUtils';
import { TargetableHandler } from '../targetableHandler';
import { createCFIFromRange } from '../utilities/helpers';

export class ElementInfoService extends TargetableHandler {
  constructor(source: CallSource) {
    super(source);
    source.bind(ElementInfoEventHandlingMessage.GetNextTextNodeCFI, this._getNextTextNodeCFI);
// tslint:disable-next-line: max-line-length
    source.bind(ElementInfoEventHandlingMessage.GetNextTextNodeRangeData, this._getNextTextNodeRangeData);
    source.bind(ElementInfoEventHandlingMessage.GetWordCFI, this._getWordCFI);
    source.bind(ElementInfoEventHandlingMessage.GetWordRangeData, this._getWordRangeData);
  }

  private async _getNextTextNodeCFI(
    callback: Callback,
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Promise<void> {
    const range = this._getNextTextNodeRange(rangeDataOrCFI, options);
    if (!range) {
      return callback('');
    }

    // Turn element into CFI
    const cfi = createCFIFromRange(range);

    return callback(cfi);
  }

  private async _getNextTextNodeRangeData(
    callback: Callback,
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Promise<void> {
    const wantedElement = this._getNextTextNode(rangeDataOrCFI, options);
    if (!wantedElement) {
      return callback(null);
    }

    // Turn element into rangeData
    const range = createRange(
      wantedElement,
      0,
      wantedElement,
      options.collapsed ? 0 : wantedElement.wholeText.length,
    );
    const rangeData = createRangeData(range);

    const marshaledRangeData = createMarshaledRangeData(rangeData);

    return callback(marshaledRangeData);
  }

  private async _getWordCFI(
    callback: Callback,
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Promise<void> {
    const range = this._getNextWordRange(rangeDataOrCFI, options);
    if (!range) {
      return callback('');
    }

    const cfi = createCFIFromRange(range);

    return callback(cfi);
  }

  private async _getWordRangeData(
    callback: Callback,
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Promise<void> {
    const range = this._getNextWordRange(rangeDataOrCFI, options);
    if (!range) {
      return callback(null);
    }

    const rangeData = createRangeData(range);

    const marshaledRangeData = createMarshaledRangeData(rangeData);

    return callback(marshaledRangeData);
  }

  private _getNextWordRange(
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Range | null {
    const startContainer = this._getStartContainer(rangeDataOrCFI);
    if (!startContainer) {
      return null;
    }

    const wantedElement = this._getNextTextNodeByStartContainer(startContainer, options);
    if (!wantedElement) {
      return null;
    }

    const sentence = wantedElement.wholeText;
    let targetOffset = 0;
    // If the startContainer is a wanted text node, check the offset to get the next word after it
    if (wantedElement === startContainer) {
      targetOffset = this._getStartOffset(rangeDataOrCFI);
    }
    const { startOffset, endOffset } = this._findNextWordAfterOffset(sentence, targetOffset);

    const range = createRange(
      wantedElement,
      startOffset,
      wantedElement,
      options.collapsed ? startOffset : endOffset,
    );

    return range;
  }

  private _getNextTextNode(
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Text | null {
    const startContainer = this._getStartContainer(rangeDataOrCFI);
    if (!startContainer) {
      return null;
    }

    return this._getNextTextNodeByStartContainer(startContainer, options);
  }

  private _getNextTextNodeRange(
    rangeDataOrCFI: RangeData | string,
    options: ITextNodeOptions,
  ): Range | null {
    const wantedElement = this._getNextTextNode(rangeDataOrCFI, options);
    if (!wantedElement) {
      return null;
    }
    const range = createRange(
      wantedElement,
      0,
      wantedElement,
      options.collapsed ? 0 : wantedElement.wholeText.length,
    );

    return range;
  }

  private _getStartOffset(rangeDataOrCFI: RangeData | string): number {
    // Return the start offset for a CFI
    if (typeof(rangeDataOrCFI) === 'string') {
      const match = rangeDataOrCFI.match(/:(\d*)/);
      return match ? Number.parseInt(match[1], 10) : 0;
    }

    // Return the start offset for a rangeData
    return rangeDataOrCFI.startOffset;
  }

  private _findNextWordAfterOffset(sentence: string, targetOffset: number = 0)
  : {startOffset: number, endOffset: number, text: string} {
    // Find first word after offset
    let text = '';
    let finishWord = false;
    let startOffset = targetOffset;
    let endOffset = 0;
    for (let i = 0; i < sentence.length; i += 1) {
      const char = sentence[i];
      const nextChar = sentence[i + 1];
      if (i > targetOffset) {
        finishWord = true;
      }

      if (nextChar === ' ' || nextChar === undefined) {
        if (finishWord && text.length !== 0) {
          text += char;
          startOffset = i - (text.length - 1);
          endOffset = i + 1;
          break;
        }
        text = '';
      } else {
        if (char !== ' ') {
          text += char;
        }
      }
    }

    return { startOffset, endOffset, text };
  }

  private _getNextTextNodeByStartContainer(
    startContainer: Element | Text,
    options: ITextNodeOptions,
  ): Text | null {
    let wantedElement: Node | null = null;
    // If start container is body, we don't need to search any parents
    if (startContainer.nodeName.toLowerCase() === 'body') {
      wantedElement = this._findTextNode(startContainer, options);
    // Otherwise, allow the search to travel all the way up to the body
    } else {
      // Check if starting container is already a desired text node
      if (options.includeFirstNode && this._isTextNodeWanted(startContainer, options)) {
        wantedElement = startContainer;
      }

      // Start with the given container and recusively search it's children
      // If no text node is found, expand search to siblings, and then parents.
      if (!wantedElement) {
        wantedElement = this._searchAllParentsForElement(startContainer, (element: Node) => {
          return <Text> this._findTextNode(element, options);
        });
      }
    }

    return <Text> wantedElement;
  }

  private _searchAllParentsForElement(
    startContainer: Element | Text,
    getWantedElement: (el: Node) => {},
    skipStartContainer?: boolean,
  ): Element | Text | null {
    const nodeName = startContainer.nodeName.toLowerCase();
    const parentNode = startContainer.parentNode;
    const canGetSiblings = parentNode && nodeName !== 'body' && nodeName !== 'html';
    const siblings = canGetSiblings ? Array.from(parentNode!.childNodes) : [startContainer];

    let wantedElement: Element | null = null;
    let startIndex = siblings.indexOf(startContainer);
    if (skipStartContainer) {
      startIndex += 1;
    }
    for (let i = startIndex; i < siblings.length; i += 1) {
      const element = <Element> getWantedElement(siblings[i]);
      if (element) {
        wantedElement = element;
        break;
      }
    }

    if (!wantedElement && canGetSiblings) {
      return this._searchAllParentsForElement(<Element> parentNode, getWantedElement, true);
    }

    return wantedElement;
  }

  private _getStartContainer(rangeDataOrCFI: RangeData | string): Element | Text | null {
    // Use body as default
    let startContainer: Element | null = document.body;

    // Get starting element via CFI
    if (typeof(rangeDataOrCFI) === 'string' && rangeDataOrCFI.length > 0) {
      const range = createRangeFromCFI(rangeDataOrCFI);
      startContainer = range ? <Element> range.startContainer : null;
    // Get starting element via RangeData
    } else if (typeof(rangeDataOrCFI) === 'object') {
      const range = createRangeFromRangeData(rangeDataOrCFI);
      startContainer = range ? <Element> range.startContainer : null;
    }

    return startContainer;
  }

  private _findTextNode(element: Node, options: ITextNodeOptions): Text | null {
    // Loop through child nodes
    let wantedText: Text | null = null;
    for (let i = 0; i < element.childNodes.length; i += 1) {
      const child = element.childNodes[i];
      // Check if child is text node
      if (child.nodeType === Node.TEXT_NODE) {
        const isWanted = this._isTextNodeWanted(child, options);

        if (isWanted) {
          wantedText = <Text> child;
          break;
        }
      }

      // If child has children, recursively check children
      if (child.hasChildNodes()) {
        wantedText = this._findTextNode(child, options);
        if (wantedText) {
          break;
        }
      }
    }

    return wantedText;
  }

  private _isTextNodeWanted(node: Node, options: ITextNodeOptions): boolean {
    if (node.nodeType !== Node.TEXT_NODE) {
      return false;
    }

    let isWanted = true;
    // Check if text is empty
    if (options.notEmpty) {
      const text = node.textContent || '';
      const trimmed = text.trim();
      if (trimmed.length <= 0) {
        isWanted = false;
      }
    }

    return isWanted;
  }
}
