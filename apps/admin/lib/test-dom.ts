/**
 * A small DOM, just enough for React 19 to mount admin client components
 * and dispatch click, input, change, and submit under `node:test`.
 * Installed as a side effect so it exists before `react-dom` loads.
 */

type Listener = {
  type: string;
  fn: (event: DomEvent) => void;
  capture: boolean;
};

export type DomNode = {
  nodeType: number;
  nodeName: string;
  tagName: string;
  namespaceURI: string;
  ownerDocument: DomDocument | null;
  parentNode: DomNode | null;
  childNodes: DomNode[];
  attributes: Record<string, string>;
  style: { setProperty: (name: string, value: string) => void } & Record<
    string,
    string
  >;
  className: string;
  value: string;
  disabled: boolean;
  checked: boolean;
  selected: boolean;
  defaultValue: string;
  defaultChecked: boolean;
  defaultSelected: boolean;
  multiple: boolean;
  size: number;
  type: string;
  name: string;
  nodeValue: string | null;
  listeners: Listener[];
  textContent: string;
  innerHTML: string;
  firstChild: DomNode | null;
  lastChild: DomNode | null;
  nextSibling: DomNode | null;
  options: DomNode[];
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
  hasAttribute: (name: string) => boolean;
  setAttributeNS: (ns: string, name: string, value: string) => void;
  removeAttributeNS: (ns: string, name: string) => void;
  appendChild: (child: DomNode) => DomNode;
  insertBefore: (child: DomNode, before: DomNode | null) => DomNode;
  removeChild: (child: DomNode) => DomNode;
  addEventListener: (
    type: string,
    fn: (event: DomEvent) => void,
    options?: boolean | { capture?: boolean },
  ) => void;
  removeEventListener: (
    type: string,
    fn: (event: DomEvent) => void,
    options?: boolean | { capture?: boolean },
  ) => void;
  focus: () => void;
  blur: () => void;
};

export type DomEvent = {
  type: string;
  target: DomNode;
  currentTarget: DomNode | null;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  eventPhase: number;
  timeStamp: number;
  button: number;
  preventDefault: () => void;
  stopPropagation: () => void;
};

export type DomDocument = DomNode & {
  nodeType: 9;
  body: DomNode;
  documentElement: DomNode;
  head: DomNode;
  activeElement: DomNode;
  defaultView: DomWindow;
  createElement: (tag: string) => DomNode;
  oninput: null;
  createElementNS: (ns: string, tag: string) => DomNode;
  createTextNode: (text: string) => DomNode;
};

type DomWindow = {
  document: DomDocument;
  HTMLIFrameElement: typeof HTMLIFrameElement;
  scrollY: number;
  scrollTo: (x: number, y: number) => void;
  addEventListener: DomNode["addEventListener"];
  removeEventListener: DomNode["removeEventListener"];
  matchMedia: (query: string) => {
    matches: boolean;
    addEventListener: () => void;
    removeEventListener: () => void;
  };
};

const HTML_NS = "http://www.w3.org/1999/xhtml";

function captureFlag(options?: boolean | { capture?: boolean }) {
  return (
    options === true ||
    (typeof options === "object" && options?.capture === true)
  );
}

function createStyle() {
  const style = {
    setProperty(name: string, value: string) {
      style[name] = value;
    },
  } as DomNode["style"];
  return style;
}

function createNode(
  doc: DomDocument | null,
  nodeType: number,
  name: string,
  namespace: string,
): DomNode {
  const node = {
    nodeType,
    nodeName: name,
    tagName: name.toUpperCase(),
    namespaceURI: namespace,
    ownerDocument: doc,
    parentNode: null,
    childNodes: [] as DomNode[],
    attributes: {} as Record<string, string>,
    style: createStyle(),
    className: "",
    disabled: false,
    checked: false,
    selected: false,
    defaultChecked: false,
    defaultSelected: false,
    multiple: false,
    size: 0,
    type: "",
    name: "",
    nodeValue: nodeType === 3 ? name : null,
    listeners: [] as Listener[],
  } as DomNode;

  node.setAttribute = (attr, value) => {
    node.attributes[attr] = String(value);
    if (attr === "value") node.value = String(value);
    if (attr === "class") node.className = String(value);
    if (attr === "type") node.type = String(value);
    if (attr === "disabled") node.disabled = true;
  };
  node.getAttribute = (attr) =>
    Object.prototype.hasOwnProperty.call(node.attributes, attr)
      ? node.attributes[attr]
      : null;
  node.hasAttribute = (attr) =>
    Object.prototype.hasOwnProperty.call(node.attributes, attr);
  node.removeAttribute = (attr) => {
    delete node.attributes[attr];
    if (attr === "disabled") node.disabled = false;
  };
  node.setAttributeNS = (_ns, attr, value) => node.setAttribute(attr, value);
  node.removeAttributeNS = (_ns, attr) => node.removeAttribute(attr);
  node.appendChild = (child) => {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = node;
    node.childNodes.push(child);
    return child;
  };
  node.insertBefore = (child, before) => {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = node;
    const index = before ? node.childNodes.indexOf(before) : -1;
    if (index < 0) node.childNodes.push(child);
    else node.childNodes.splice(index, 0, child);
    return child;
  };
  node.removeChild = (child) => {
    const index = node.childNodes.indexOf(child);
    if (index < 0) throw new Error("node is not a child");
    node.childNodes.splice(index, 1);
    child.parentNode = null;
    return child;
  };
  node.addEventListener = (type, fn, options) => {
    node.listeners.push({ type, fn, capture: captureFlag(options) });
  };
  node.removeEventListener = (type, fn, options) => {
    const capture = captureFlag(options);
    node.listeners = node.listeners.filter(
      (listener) =>
        !(
          listener.type === type &&
          listener.fn === fn &&
          listener.capture === capture
        ),
    );
  };
  node.focus = () => {
    if (doc) doc.activeElement = node;
  };
  node.blur = () => {
    if (doc && doc.activeElement === node) doc.activeElement = doc.body;
  };

  let currentValue = "";
  let defaultValue = "";
  let valueDirty = false;
  Object.defineProperty(node, "value", {
    configurable: true,
    get() {
      return currentValue;
    },
    set(next: string) {
      currentValue = next == null ? "" : String(next);
      valueDirty = true;
    },
  });
  Object.defineProperty(node, "defaultValue", {
    configurable: true,
    get() {
      return defaultValue;
    },
    set(next: string) {
      defaultValue = next == null ? "" : String(next);
      if (!valueDirty) currentValue = defaultValue;
    },
  });

  Object.defineProperty(node, "firstChild", {
    configurable: true,
    get() {
      return node.childNodes[0] ?? null;
    },
  });
  Object.defineProperty(node, "lastChild", {
    configurable: true,
    get() {
      return node.childNodes[node.childNodes.length - 1] ?? null;
    },
  });
  Object.defineProperty(node, "nextSibling", {
    configurable: true,
    get() {
      if (!node.parentNode) return null;
      const index = node.parentNode.childNodes.indexOf(node);
      return node.parentNode.childNodes[index + 1] ?? null;
    },
  });
  Object.defineProperty(node, "textContent", {
    configurable: true,
    get() {
      if (node.nodeType === 3) return node.nodeValue ?? "";
      return node.childNodes.map((child) => child.textContent).join("");
    },
    set(value: string) {
      for (const child of node.childNodes) child.parentNode = null;
      node.childNodes = [];
      if (value) {
        const text = createNode(doc, 3, value, namespace);
        text.nodeValue = value;
        text.parentNode = node;
        node.childNodes.push(text);
      }
    },
  });
  Object.defineProperty(node, "innerHTML", {
    configurable: true,
    get() {
      return node.textContent;
    },
    set(value: string) {
      node.textContent = value.replace(/<[^>]*>/g, "");
    },
  });
  Object.defineProperty(node, "options", {
    configurable: true,
    get() {
      const found: DomNode[] = [];
      const visit = (current: DomNode) => {
        for (const child of current.childNodes) {
          if (child.nodeName === "option") found.push(child);
          else visit(child);
        }
      };
      visit(node);
      return found;
    },
  });
  return node;
}

function createDocument(): DomDocument {
  const doc = createNode(null, 9, "#document", HTML_NS) as DomDocument;
  doc.ownerDocument = doc;
  doc.createElement = (tag) => {
    const element = createNode(doc, 1, tag, HTML_NS);
    if (tag === "input") element.type = "text";
    return element;
  };
  doc.createElementNS = (ns, tag) => createNode(doc, 1, tag, ns || HTML_NS);
  doc.createTextNode = (text) => {
    const textNode = createNode(doc, 3, text, HTML_NS);
    textNode.nodeValue = text;
    return textNode;
  };
  doc.documentElement = doc.createElement("html");
  doc.head = doc.createElement("head");
  doc.body = doc.createElement("body");
  doc.appendChild(doc.documentElement);
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);
  doc.activeElement = doc.body;
  doc.oninput = null;
  return doc;
}

const document = createDocument();

const windowListeners: Listener[] = [];
class HTMLIFrameElement {}
const domWindow: DomWindow = {
  document,
  HTMLIFrameElement,
  scrollY: 0,
  scrollTo() {},
  addEventListener(type, fn, options) {
    windowListeners.push({ type, fn, capture: captureFlag(options) });
  },
  removeEventListener(type, fn, options) {
    const capture = captureFlag(options);
    const next = windowListeners.filter(
      (listener) =>
        !(
          listener.type === type &&
          listener.fn === fn &&
          listener.capture === capture
        ),
    );
    windowListeners.length = 0;
    windowListeners.push(...next);
  },
  matchMedia() {
    return {
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    };
  },
};
document.defaultView = domWindow;

const globals = globalThis as unknown as {
  window: DomWindow;
  document: DomDocument;
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
globals.window = domWindow;
globals.document = document;
globals.IS_REACT_ACT_ENVIRONMENT = true;

export function domDocument() {
  return document;
}

export function textOf(node: DomNode) {
  return node.textContent;
}

export function walk(node: DomNode, visit: (node: DomNode) => void) {
  visit(node);
  for (const child of node.childNodes) walk(child, visit);
}

export function elements(root: DomNode, tag: string) {
  const found: DomNode[] = [];
  walk(root, (node) => {
    if (node.nodeName === tag) found.push(node);
  });
  return found;
}

function stopped(event: DomEvent) {
  return (
    (event as DomEvent & { propagationStopped?: boolean })
      .propagationStopped === true
  );
}

export function dispatch(target: DomNode, type: string) {
  const event: DomEvent & { propagationStopped?: boolean } = {
    type,
    target,
    currentTarget: null,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    timeStamp: Date.now(),
    button: 0,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
  };
  const path: DomNode[] = [];
  let current: DomNode | null = target;
  while (current) {
    path.push(current);
    current = current.parentNode;
  }
  for (let i = path.length - 1; i >= 0 && !stopped(event); i -= 1) {
    event.currentTarget = path[i];
    event.eventPhase = 1;
    for (const listener of [...path[i].listeners]) {
      if (listener.type === type && listener.capture) listener.fn(event);
    }
  }
  for (const node of path) {
    if (stopped(event)) break;
    event.currentTarget = node;
    event.eventPhase = 3;
    for (const listener of [...node.listeners]) {
      if (listener.type === type && !listener.capture) listener.fn(event);
    }
  }
  return event;
}

export function click(node: DomNode) {
  if (node.disabled || node.hasAttribute("disabled")) return;
  dispatch(node, "click");
  const type = node.getAttribute("type");
  if (node.nodeName === "button" && type !== "button" && type !== "reset") {
    let parent = node.parentNode;
    while (parent && parent.nodeName !== "form") parent = parent.parentNode;
    if (parent) dispatch(parent, "submit");
  }
}

export function setControlValue(node: DomNode, value: string) {
  node.value = value;
  dispatch(node, "input");
  dispatch(node, "change");
}
