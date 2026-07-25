const eventTarget = new EventTarget();
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("momente-photos") : null;

export function emitPhotosUpdated() {
  eventTarget.dispatchEvent(new Event("updated"));
  channel?.postMessage("updated");
}

export function subscribeToPhotoUpdates(callback: () => void) {
  const localHandler = () => callback();
  const channelHandler = () => callback();
  eventTarget.addEventListener("updated", localHandler);
  channel?.addEventListener("message", channelHandler);

  return () => {
    eventTarget.removeEventListener("updated", localHandler);
    channel?.removeEventListener("message", channelHandler);
  };
}
