import { wrap } from "comlink";

const blob = new Blob(
  [
    `
    import { expose } from 'comlink';
    import * as api from 'WORKER_PATH';
    expose(api);
    `,
  ],
  { type: "application/typescript" }
);

const url = URL.createObjectURL(blob);
const worker = new Worker(url);
worker.unref();
const { promise, resolve, reject } = Promise.withResolvers();
worker.addEventListener("open", resolve);
worker.addEventListener("error", ({ message }) => reject(message));

const api = wrap(worker);

await promise;
