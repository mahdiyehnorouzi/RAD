import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BadRequestException,
  RequestMethod,
  ValidationPipe,
} from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import type { JwtService } from "@nestjs/jwt";
import type { Response } from "express";
import type { Repository } from "typeorm";
import type { User } from "../database/entities";
import { AUTH_COOKIE, GUEST_COOKIE } from "../common/cookies";
import type { Actor } from "../common/identity";
import { IdentityService } from "../common/identity.service";
import {
  SessionMiddleware,
  type AuthedRequest,
} from "../common/session.middleware";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-item.dto";
import type { CartSnapshot } from "./type";

const GUEST = "11111111-1111-4111-8111-111111111111";

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

const empty: CartSnapshot = {
  slugs: [],
  holds: {},
  prices: {},
  pendingOrders: [],
};

const held: CartSnapshot = {
  slugs: ["work-a"],
  holds: { "work-a": 1_700_000_000_000 },
  prices: { "work-a": { toman: 8_500_000, usd: 100 } },
  pendingOrders: [
    {
      id: "order-1",
      status: "pending_payment",
      paymentDueAt: 1_700_000_100_000,
      slugs: ["held-work"],
    },
  ],
};

const account = {
  id: "test-user",
  name: "Test",
  email: "test@example.invalid",
  phone: null,
  role: "artist",
  adminRole: "viewer",
} as User;

const signedIn: Actor = {
  user: {
    id: "test-user",
    name: "Test",
    email: "test@example.invalid",
    phone: null,
    role: "artist",
    adminRole: "viewer",
  },
  guestId: GUEST,
};

const guest: Actor = { user: null, guestId: GUEST };

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

test("AddCartItemDto uses the global validation pipe rules", async () => {
  const accepted = await pipe.transform(
    { slug: "work-a" },
    { type: "body", metatype: AddCartItemDto },
  );
  assert.equal(accepted.slug, "work-a");

  const spaced = await pipe.transform(
    { slug: " " },
    { type: "body", metatype: AddCartItemDto },
  );
  assert.equal(spaced.slug, " ");

  for (const input of [
    {},
    { slug: "" },
    { slug: 123 },
    { slug: null },
    { slug: "work-a", ownerKey: "guest:injected" },
  ]) {
    await assert.rejects(
      () => pipe.transform(input, { type: "body", metatype: AddCartItemDto }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  }
});

test("controller returns the service snapshot for the resolved actor", async () => {
  const calls: unknown[][] = [];
  const controller = controllerFor(account, calls);
  const guestRequest = await session();
  const userRequest = await session("good-token");

  assert.deepEqual(await controller.get(guestRequest), empty);
  assert.deepEqual(await controller.add({ slug: "work-a" }, userRequest), held);
  assert.deepEqual(await controller.remove("work-a", userRequest), empty);
  assert.deepEqual(await controller.clear(guestRequest), held);

  assert.deepEqual(calls, [
    ["get", guest],
    ["add", signedIn, "work-a"],
    ["remove", signedIn, "work-a"],
    ["clear", guest],
  ]);
});

test("a session user id with no user row stays a guest", async () => {
  const calls: unknown[][] = [];
  const controller = controllerFor(null, calls);
  const request = await session("good-token");
  assert.equal(request.userId, "test-user");
  assert.equal(request.userRole, "customer");
  assert.equal(request.adminRole, "editor");

  assert.deepEqual(await controller.get(request), empty);
  assert.deepEqual(calls, [["get", guest]]);
});

test("an invalid auth cookie is cleared and the actor stays a guest", async () => {
  const calls: unknown[][] = [];
  const controller = controllerFor(account, calls);
  const cleared: string[] = [];
  const request = await session("bad-token", cleared);

  assert.equal(request.userId, undefined);
  assert.deepEqual(cleared, [AUTH_COOKIE]);
  assert.deepEqual(await controller.clear(request), held);
  assert.deepEqual(calls, [["clear", guest]]);
});

function controllerFor(user: User | null, calls: unknown[][]) {
  const cart = {
    async get(actor: Actor) {
      calls.push(["get", actor]);
      return empty;
    },
    async add(actor: Actor, slug: string) {
      calls.push(["add", actor, slug]);
      return held;
    },
    async remove(actor: Actor, slug: string) {
      calls.push(["remove", actor, slug]);
      return empty;
    },
    async clear(actor: Actor) {
      calls.push(["clear", actor]);
      return held;
    },
  } as unknown as CartService;
  const users = {
    async findOne(options?: { where?: { id?: string } }) {
      if (!user || options?.where?.id !== user.id) return null;
      return user;
    },
  } as unknown as Repository<User>;
  return new CartController(cart, new IdentityService(users));
}

async function session(token?: string, cleared: string[] = []) {
  const jwt = {
    async verifyAsync(value: string) {
      if (value !== "good-token") throw new Error("invalid");
      return { sub: "test-user", role: "customer", adminRole: "editor" };
    },
  } as JwtService;
  const request = {
    cookies: {
      [GUEST_COOKIE]: GUEST,
      ...(token ? { [AUTH_COOKIE]: token } : {}),
    },
    get() {
      return undefined;
    },
  } as unknown as AuthedRequest;
  const response = {
    cookie() {},
    clearCookie(name: string) {
      cleared.push(name);
    },
  } as unknown as Response;
  let continued = false;
  await new SessionMiddleware(jwt).use(request, response, () => {
    continued = true;
  });
  assert.equal(continued, true);
  assert.equal(request.guestId, GUEST);
  return request;
}
