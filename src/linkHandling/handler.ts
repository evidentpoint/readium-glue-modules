import { Callback, CallSource } from '@readium/glue-rpc';
import { EventHandlingMessage, IAddEventListenerOptions } from '../eventHandling/interface';
import { marshalObject } from '@readium/glue-rpc/lib/marshaling';
import { eventPath } from '../utilities/helpers';
import { TargetableHandler } from '../targetableHandler';

export class LinkHandler extends TargetableHandler {
  constructor(source: CallSource) {
    super(source);
    source.bind(EventHandlingMessage.AddEventListener, this._addEventListener);
    source.bind(EventHandlingMessage.RemoveEventListener, this._removeEventListener);
  }

  protected createHandler(callback: Callback, options: IAddEventListenerOptions): EventListener {
    return (event) => {
      const path = eventPath(event);

      const anchor: HTMLAnchorElement = path.find((element) => {
        return element.tagName.toLowerCase() === 'a';
      });

      if (!anchor || !anchor.href) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (options.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }

      const newHref = { href: anchor.href };
      const obj = marshalObject(newHref);
      callback(obj);
    };
  }

  private async _addEventListener(
    callback: Callback,
    eventType: string,
    options: IAddEventListenerOptions,
  ): Promise<number> {
    const listener: EventListener = this.createHandler(callback, options);
    const target = options.target || '@window';
    return this.registerListenerForTargets(target, eventType, listener);
  }

  private async _removeEventListener({  }: Callback, listenerID: number): Promise<void> {
    this.removeEventListeners(listenerID);
  }
}
