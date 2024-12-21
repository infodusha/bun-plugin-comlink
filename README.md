# bun-plugin-comlink

That is [comlink](https://github.com/GoogleChromeLabs/comlink) loader for Workers in [Bun](https://bun.sh).

## Installation

```sh
bun add bun-plugin-comlink
```

Create a `plugin.ts` file:

```ts
import { plugin } from "bun";
import comlinkPlugin from "bun-plugin-comlink";

await plugin(comlinkPlugin());
```

Add `plugin.ts` to `bunfig.toml`:

```toml
preload = ["./plugin.ts"]
```

## Usage

Create a `functions.worker.ts` file:

```ts
export async function sayHello() {
  return "Hello from worker!";
}
```

So later you can import it in your main file:

```ts
import { sayHello } from "./functions.worker";

console.log(await sayHello());
```

## Limitations

- You can't have sync functions with comlink

## License

Apache-2.0
