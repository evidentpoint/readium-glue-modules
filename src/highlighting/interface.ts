export enum EventHandlingMessage {
  CreateHighlight = 'CREATE_HIGHLIGHT',
  DeleteHighlight = 'DELETE_HIGHLIGHT',
}

export interface IHighlightOptions {}

export interface IHighlightDeletionOptions {
  fadeOut: number;
}
