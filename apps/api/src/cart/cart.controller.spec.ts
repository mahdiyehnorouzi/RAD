import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RequestMethod } from "@nestjs/common";
import type { AuthedRequest } from "../common/session.middleware";
import type { Actor } from "../common/identity";
import { IdentityService } from "../common/identity.service";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-item.dto";

test("cart route decorators preserve existing methods and paths", () => {
  assert.equal(Reflect.getMetadata(PATH_METADATA, CartController), "cart");
  for (const [name, method, path] of [
    ["get", RequestMethod.GET, "/"],
    ["add", RequestMethod.POST, "items"],
    ["remove", RequestMethod.DELETE, "items/:slug"],
    ["clear", RequestMethod.DELETE, "/"],
  ] as const) {
    const handler = CartController.prototype[name];
    assert.equal(Reflect.getMetadata(METHOD_METADATA, handler), method);
    assert.equal(Reflect.getMetadata(PATH_METADATA, handler), path);
  }
});

test("AddCartItemDto accepts a nonempty slug and rejects missing, blank or non-string values", async () => {
  for (const slug of ["work-a", "another-work"]) {
    assert.deepEqual(
      await validate(plainToInstance(AddCartItemDto, { slug })),
      [],
    );
  }

  for (const input of [{}, { slug: "" }, { slug: 123 }, { slug: null }]) {
    const errors = await validate(plainToInstance(AddCartItemDto, input));
    assert.ok(errors.some((error) => error.property === "slug"));
  }
});

test("controller resolves the actor from each request and delegates unchanged arguments", async () => {
  const calls: unknown[][] = [];
  const guest: Actor = { user: null, guestId: "test-guest" };
  const signedIn: Actor = {
    user: {
      id: "test-user",
      name: "Test",
      email: "test@example.invalid",
      role: "customer",
    },
    guestId: "test-guest",
  };
  const identity = {
    async fromRequest(request: AuthedRequest) {
      calls.push(["identity", request]);
      return request.userId ? signedIn : guest;
    },
  } as IdentityService;
  const cart = {
    async get(actor: Actor) {
      calls.push(["get", actor]);
      return { slugs: [], holds: {}, prices: {} };
    },
    async add(actor: Actor, slug: string) {
      calls.push(["add", actor, slug]);
      return { slugs: [slug], holds: {}, prices: {} };
    },
    async remove(actor: Actor, slug: string) {
      calls.push(["remove", actor, slug]);
      return { slugs: [], holds: {}, prices: {} };
    },
    async clear(actor: Actor) {
      calls.push(["clear", actor]);
      return { slugs: [], holds: {}, prices: {} };
    },
  } as CartService;
  const controller = new CartController(cart, identity);
  const guestRequest = { guestId: "test-guest" } as AuthedRequest;
  const userRequest = {
    guestId: "test-guest",
    userId: "test-user",
  } as AuthedRequest;

  assert.deepEqual((await controller.get(guestRequest)).slugs, []);
  assert.deepEqual((await controller.add({ slug: "work-a" }, userRequest)).slugs, [
    "work-a",
  ]);
  assert.deepEqual(
    (await controller.remove("work-a", userRequest)).slugs,
    [],
  );
  assert.deepEqual((await controller.clear(guestRequest)).slugs, []);

  assert.deepEqual(calls, [
    ["identity", guestRequest],
    ["get", guest],
    ["identity", userRequest],
    ["add", signedIn, "work-a"],
    ["identity", userRequest],
    ["remove", signedIn, "work-a"],
    ["identity", guestRequest],
    ["clear", guest],
  ]);
});
