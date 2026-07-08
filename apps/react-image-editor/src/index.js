import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import TuiImageEditor from 'tui-image-editor';

const isEventHandlerKeys = (key) => /on[A-Z][a-zA-Z]+/.test(key);

const ImageEditorComponent = forwardRef((props, ref) => {
  const rootEl = useRef(null);
  const imageEditorInst = useRef(null);
  const prevProps = useRef({});

  useEffect(() => {
    if (!imageEditorInst.current && rootEl.current) {
      imageEditorInst.current = new TuiImageEditor(rootEl.current, {
        ...props,
      });

      Object.keys(props)
        .filter(isEventHandlerKeys)
        .forEach((key) => {
          const eventName = key[2].toLowerCase() + key.slice(3);
          imageEditorInst.current.on(eventName, props[key]);
        });

      prevProps.current = { ...props };
    }

    return () => {
      if (imageEditorInst.current) {
        Object.keys(props)
          .filter(isEventHandlerKeys)
          .forEach((key) => {
            const eventName = key[2].toLowerCase() + key.slice(3);
            imageEditorInst.current.off(eventName);
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

      Object.keys(currentProps)
        .filter(isEventHandlerKeys)
        .forEach((key) => {
          const eventName = key[2].toLowerCase() + key.slice(3);
          if (previousProps[key] !== currentProps[key]) {
            imageEditorInst.current.off(eventName);
            imageEditorInst.current.on(eventName, currentProps[key]);
          }
        });

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
