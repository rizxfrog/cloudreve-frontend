/// <reference types="vite/client" />

// Injected by vite.config.ts `define`. It carries the frontend package version
// of the build that is running.
declare const __ASSETS_VERSION__: string;

// Promise.withResolvers is part of ES2024 and is implemented by every browser
// this application targets, but the TypeScript version used here predates its
// lib definitions. Declaring it keeps the source free of a hand-rolled promise
// executor without lowering the whole project's lib target.
interface PromiseConstructor {
  withResolvers<T>(): {
    promise: Promise<T>;
    resolve: (value: PromiseLike<T> | T) => void;
    reject: (reason?: unknown) => void;
  };
}
