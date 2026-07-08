import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import TuiImageEditor from 'tui-image-editor';

const isEventHandlerKeys = (key) => /on[A-Z][a-zA-Z]+/.test(key);

const getEventName = (key) => key[2].toLowerCase() + key.slice(3);

const getEventHandlerKeys = (props) => Object.keys(props).filter(isEventHandlerKeys);

const syncEventHandlers = (imageEditor, currentProps, previousProps = {}) => {
  const eventHandlerKeys = Array.from(
    new Set([...getEventHandlerKeys(previousProps), ...getEventHandlerKeys(currentProps)])
  );

  eventHandlerKeys.forEach((key) => {
    const eventName = getEventName(key);
    const currentHandler = currentProps[key];
    const previousHandler = previousProps[key];

    if (previousHandler && previousHandler !== currentHandler) {
      imageEditor.off(eventName);
    }
    if (currentHandler && previousHandler !== currentHandler) {
      imageEditor.on(eventName, currentHandler);
    }
  });
};

const ImageEditorComponent = forwardRef((props, ref) => {
  const rootEl = useRef(null);
  const imageEditorInst = useRef(null);
  const prevProps = useRef({});

  useEffect(() => {
    if (!imageEditorInst.current && rootEl.current) {
      imageEditorInst.current = new TuiImageEditor(rootEl.current, {
        ...props,
      });

      syncEventHandlers(imageEditorInst.current, props);

      prevProps.current = { ...props };
    }

    return () => {
      if (imageEditorInst.current) {
        getEventHandlerKeys(props).forEach((key) => {
          imageEditorInst.current.off(getEventName(key));
        });
        imageEditorInst.current.destroy();
        imageEditorInst.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (imageEditorInst.current) {
      const currentProps = props;
      const previousProps = prevProps.current;

      syncEventHandlers(imageEditorInst.current, currentProps, previousProps);

      prevProps.current = { ...props };
    }
  });

  useImperativeHandle(ref, () => ({
    getInstance: () => imageEditorInst.current,
    getRootElement: () => rootEl.current,
  }));

  return <div ref={rootEl} />;
});

// For backwards compatibility with static properties or class-based identification
class ImageEditor extends React.Component {
  constructor(props) {
    super(props);
    this.editorRef = React.createRef();
  }
  
  getInstance() {
    return this.editorRef.current ? this.editorRef.current.getInstance() : null;
  }
  
  getRootElement() {
    return this.editorRef.current ? this.editorRef.current.getRootElement() : null;
  }
  
  render() {
    return <ImageEditorComponent ref={this.editorRef} {...this.props} />;
  }
}

export default ImageEditor;
