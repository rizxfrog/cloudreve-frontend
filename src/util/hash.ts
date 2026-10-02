import { CancelToken } from "../component/Uploader/core/utils/request";
import { HashResult } from "./hash.worker";

// CancelToken is exported as a value (the axios class); this is its instance
// type, which is what a caller holds.
type CancelTokenInstance = InstanceType<typeof CancelToken>;

// Compute the SHA-256 of a file in a worker thread. A file is described by its
// digest, so a content-addressed storage policy needs the hash before the
// upload so the server can address the object without buffering the whole file.
export function hashFile(
  file: File,
  onProgress?: (percent: number) => void,
  cancel?: CancelTokenInstance,
): Promise<HashResult> {
  const { promise, resolve, reject } = Promise.withResolvers<HashResult>();

  const worker = new Worker(new URL("./hash.worker.ts", import.meta.url), {
    type: "module",
  });

  const cleanup = () => {
    worker.terminate();
    cancel?.unsubscribe(onAbort);
  };

  function onAbort() {
    cleanup();
    reject(new Error("已取消"));
  }

  worker.onmessage = ({ data }: MessageEvent<{ hash?: string; progress?: number; error?: string }>) => {
    if (data.error) {
      cleanup();
      reject(new Error(data.error));
      return;
    }

    if (data.hash) {
      cleanup();
      resolve(data.hash);
      return;
    }

    if (typeof data.progress === "number") {
      onProgress?.(data.progress);
    }
  };

  worker.onerror = () => {
    cleanup();
    // A worker failure must not be fatal: the caller can still upload without a
    // client hash, at the cost of the server buffering the content.
    reject(new Error("文件指纹计算失败"));
  };

  if (cancel?.reason) {
    onAbort();
    return promise;
  }

  cancel?.subscribe(onAbort);
  worker.postMessage(file);

  return promise;
}
