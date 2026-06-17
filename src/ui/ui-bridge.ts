// Shared singleton bridge between the engine (main.ts) and the
// demo chrome (ui.ts). Neither side imports the other directly —
// they only know about this. Delete ui.ts/ui.css/#ui-root and
// main.ts's bridge.on("mutate", ...) call simply never fires.

type BridgeEvents = {
  mutate: undefined;
  tick: { fps: number };
};

class UIBridge extends EventTarget {
  emit<K extends keyof BridgeEvents>(type: K, detail?: BridgeEvents[K]) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends keyof BridgeEvents>(
    type: K,
    callback: (detail: BridgeEvents[K]) => void,
  ) {
    this.addEventListener(type, (event) => {
      callback((event as CustomEvent<BridgeEvents[K]>).detail);
    });
  }
}

export const bridge = new UIBridge();