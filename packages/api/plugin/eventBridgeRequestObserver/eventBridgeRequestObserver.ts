import { EventBridgeObserver } from "o18k-ts-aws";
import { getTemplate } from "../../template";

export async function eventBridgeRequestObserverWrapper(event, context) {
  const template = getTemplate();
  return EventBridgeObserver(event, context, template);
}
