import { createSHA256 } from "hash-wasm";

// Computes the SHA-256 of a file without loading it into memory. The digest is
// what content-addressed storage policies use to name the physical object, so
// the upload can address its target before the content is sent.
//
// Reading happens in fixed slices and is handed to the hash incrementally, so
// peak memory stays at one chunk regardless of file size.

const CHUNK_SIZE = 4 * 1024 * 1024;

type Progress = { progress: number };

export type HashResult = string;

export type HashError = { error: string };

self.onmessage = async (event: MessageEvent<File>) => {
  const file = event.data;

  try {
    const hasher = await createSHA256();
    hasher.init();

    for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      hasher.update(new Uint8Array(await slice.arrayBuffer()));

      const message: Progress = {
        progress: Math.min(100, ((offset + CHUNK_SIZE) / file.size) * 100),
      };
      self.postMessage(message);
    }

    self.postMessage({ hash: hasher.digest("hex") });
  } catch {
    // Reading can fail when the file was moved, renamed or unmounted between
    // selection and hashing, which is common for removable media.
    self.postMessage({ error: "无法读取文件内容，请确认文件仍然可用" });
  }
};
