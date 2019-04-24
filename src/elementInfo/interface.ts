export enum ElementInfoEventHandlingMessage {
  GetNextTextNodeCFI = 'GET_NEXT_TEXT_NODE_CFI',
  GetNextTextNodeRangeData = 'GET_NEXT_TEXT_NODE_RANGE_DATA',
  GetNextWordCFI = 'GET_NEXT_WORD_CFI',
  GetNextWordRangeData = 'GET_NEXT_WORD_RANGE_DATA',
}

export interface ITextNodeOptions {
  // Find text node that is not empty
  notEmpty?: boolean;
  // If the first node is already a text node, return that text node back
  includeFirstNode?: boolean;
  // If true, the RangeData / CFI will be returned in a collapsed form
  collapsed?: boolean;
}
