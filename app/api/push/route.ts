// TODO: Web Push notification endpoint — Phase 2.
// Receives push subscription objects from the client and stores them in push_subscriptions.
// Do not implement until stops are added to the database.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Push notifications are a Phase 2 feature" },
    { status: 501 }
  );
}
