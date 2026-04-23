// Web push subscription helpers — Phase 2
// Do not implement until stops are added to the database

export async function subscribeToPush(
  _busId: string,
  _stopId: string
): Promise<void> {
  throw new Error("Push notifications are a Phase 2 feature");
}

export async function unsubscribeFromPush(): Promise<void> {
  throw new Error("Push notifications are a Phase 2 feature");
}
