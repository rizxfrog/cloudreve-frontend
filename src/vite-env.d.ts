/// <reference types="vite/client" />

// Promise.withResolvers is part of ES2024 and is implemented by every browser
// this application targets, but the TypeScript version used here predates its
// lib definitions. Declaring it keeps the source free of a hand-rolled promise
// executor without lowering the whole project's lib target.
interface PromiseConstructor {
  withResolvers<T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
}
