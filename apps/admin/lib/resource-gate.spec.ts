import assert from "node:assert/strict";
import { test } from "node:test";
import { ResourceGate, resourceListPhase } from "./resource-gate";

test("a slow initial load stays loading and does not look empty", () => {
  const gate = new ResourceGate<"reviews">();
  assert.equal(resourceListPhase(gate.status("reviews"), 0), "loading");
  const generation = gate.begin("reviews", "initial");
  assert.ok(generation);
  assert.equal(gate.status("reviews").initialLoading, true);
  assert.equal(gate.status("reviews").refreshing, false);
  assert.equal(resourceListPhase(gate.status("reviews"), 0), "loading");
});

test("an empty successful response is empty only after the load settles", () => {
  const gate = new ResourceGate<"users">();
  const generation = gate.begin("users", "initial")!;
  assert.equal(gate.settle("users", generation, true), "applied");
  const status = gate.status("users");
  assert.equal(status.loaded, true);
  assert.equal(status.loadError, false);
  assert.equal(resourceListPhase(status, 0), "empty");
});

test("a successful response with rows is ready", () => {
  const gate = new ResourceGate<"messages">();
  const generation = gate.begin("messages", "initial")!;
  gate.settle("messages", generation, true);
  assert.equal(resourceListPhase(gate.status("messages"), 4), "ready");
});

test("an initial failure is an error, not an empty list, and retry can succeed", () => {
  const gate = new ResourceGate<"help">();
  const failed = gate.begin("help", "initial")!;
  assert.equal(gate.settle("help", failed, false), "applied");
  assert.equal(resourceListPhase(gate.status("help"), 0), "error");
  assert.equal(gate.status("help").refreshError, false);

  const retried = gate.begin("help", "initial");
  assert.ok(retried);
  assert.notEqual(retried, failed);
  assert.equal(gate.settle("help", retried, true), "applied");
  assert.equal(resourceListPhase(gate.status("help"), 0), "empty");
  assert.equal(gate.status("help").loadError, false);
});

test("a second initial load while one is in flight is not started", () => {
  const gate = new ResourceGate<"shape">();
  const first = gate.begin("shape", "initial");
  const second = gate.begin("shape", "initial");
  assert.ok(first);
  assert.equal(second, null);
  assert.equal(gate.settle("shape", first, true), "applied");
  assert.equal(gate.begin("shape", "initial"), null);
});

test("a refresh keeps committed data and a refresh failure is not a full error", () => {
  const gate = new ResourceGate<"messages">();
  const initial = gate.begin("messages", "initial")!;
  gate.settle("messages", initial, true);
  const refresh = gate.begin("messages", "refresh")!;
  const refreshing = gate.status("messages");
  assert.equal(refreshing.loaded, true);
  assert.equal(refreshing.refreshing, true);
  assert.equal(refreshing.initialLoading, false);
  assert.equal(resourceListPhase(refreshing, 2), "ready");

  assert.equal(gate.settle("messages", refresh, false), "applied");
  const failed = gate.status("messages");
  assert.equal(failed.loaded, true);
  assert.equal(failed.loadError, false);
  assert.equal(failed.refreshError, true);
  assert.equal(failed.refreshing, false);
  assert.equal(resourceListPhase(failed, 2), "ready");
});

test("an older refresh response is ignored when a newer one is in flight", () => {
  const gate = new ResourceGate<"messages">();
  gate.settle("messages", gate.begin("messages", "initial")!, true);
  const older = gate.begin("messages", "refresh")!;
  const newer = gate.begin("messages", "refresh")!;
  assert.equal(gate.settle("messages", older, true), "stale");
  assert.equal(gate.status("messages").refreshing, true);
  assert.equal(gate.status("messages").refreshError, false);
  assert.equal(gate.settle("messages", newer, false), "applied");
  assert.equal(gate.status("messages").refreshError, true);
  assert.equal(gate.status("messages").loaded, true);
});

test("a refresh is not started before the first successful load", () => {
  const gate = new ResourceGate<"members">();
  assert.equal(gate.begin("members", "refresh"), null);
  const failed = gate.begin("members", "initial")!;
  gate.settle("members", failed, false);
  assert.equal(gate.begin("members", "refresh"), null);
});

test("reset makes an in-flight success stale so a signed-out session cannot commit", () => {
  const gate = new ResourceGate<"users">();
  const generation = gate.begin("users", "initial")!;
  gate.reset();
  assert.equal(gate.settle("users", generation, true), "stale");
  assert.equal(gate.status("users").loaded, false);
  assert.equal(resourceListPhase(gate.status("users"), 3), "loading");
});

test("retry after a refresh failure clears the error only when the new attempt succeeds", () => {
  const gate = new ResourceGate<"messages">();
  gate.settle("messages", gate.begin("messages", "initial")!, true);
  gate.settle("messages", gate.begin("messages", "refresh")!, false);
  const retry = gate.begin("messages", "refresh")!;
  assert.equal(gate.status("messages").refreshError, true);
  assert.equal(gate.status("messages").refreshing, true);
  gate.settle("messages", retry, true);
  const status = gate.status("messages");
  assert.equal(status.refreshError, false);
  assert.equal(status.loaded, true);
});
