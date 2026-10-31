/**
 * Safari applies Set-Cookie only after a response arrives. Until the first
 * API call finishes, every other call must wait — otherwise each cookieless
 * request is a new guest and a hold can land on an id the browser drops.
 * After one response has been received, later calls run together.
 */
export function createRequestGate() {
  let ready = false;
  let tail: Promise<void> = Promise.resolve();

  return async function gate<T>(run: () => Promise<T>): Promise<T> {
    if (ready) return run();
    const wait = tail;
    let release!: () => void;
    tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await wait;
    try {
      const result = await run();
      ready = true;
      return result;
    } finally {
      release();
    }
  };
}
