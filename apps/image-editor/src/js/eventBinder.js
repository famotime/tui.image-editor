import forEach from 'tui-code-snippet/collection/forEach';

function makeEventHandlerMap(handlers, eventHandlerNames) {
  const eventHandlers = {};

  forEach(eventHandlerNames, (handlerName, eventName) => {
    eventHandlers[eventName] = handlers[handlerName];
  });

  return eventHandlers;
}

export function bindEvents(target, handlers, eventHandlerNames) {
  target.on(makeEventHandlerMap(handlers, eventHandlerNames));
}

export function unbindEvents(target, handlers, eventHandlerNames) {
  target.off(makeEventHandlerMap(handlers, eventHandlerNames));
}
