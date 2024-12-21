import { file, type BunPlugin } from "bun";

export default function comlinkPlugin(): BunPlugin {
  return {
    name: "comlink",
    async setup(build) {
      const loaderScript = await file("./loader.ts").text();

      build.onLoad({ filter: /\.worker.ts$/ }, async ({ path }) => {
        const worker = await file(path).text();
        const exportNames = await getExportNames(worker);
        const exportCode = exportNames
          .map((name) => `export const ${name} = api.${name};`)
          .join("\n");

        const contents =
          loaderScript.replace("WORKER_PATH", path) + "\n" + exportCode;
        return {
          contents,
          loader: "ts",
        };
      });
    },
  };
}

async function getExportNames(code: string) {
  const acorn = await import("acorn");
  const walk = await import("acorn-walk");
  const program = acorn.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
  });

  const names: string[] = [];

  walk.simple(program, {
    ExportNamedDeclaration(node) {
      switch (node.declaration?.type) {
        case "FunctionDeclaration":
          if (!node.declaration.async) {
            throw new Error("You can't have sync functions with comlink");
          }
          names.push(node.declaration.id.name);
          break;
        case "VariableDeclaration":
          const [name] = node.declaration.declarations
            .filter((d) => d.type === "VariableDeclarator")
            .map((d) => (d.id.type === "Identifier" ? d.id.name : null))
            .filter(Boolean);
          // TODO check if async
          if (!name) {
            throw new Error("You can't have an anonymous export");
          }
          names.push(name);
          break;
        default:
          throw new Error("Unknown export type");
      }
    },
  });

  return names;
}
