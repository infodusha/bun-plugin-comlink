import { file, type BunPlugin } from "bun";

export default function comlinkPlugin(): BunPlugin {
  return {
    name: "comlink",
    async setup(build) {
      const loaderScript = await file("./loader.ts").text();

      build.onLoad({ filter: /\.worker.(j|t)s$/ }, async ({ path }) => {
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
            throw new Error("You can't have sync functions in worker");
          }
          names.push(node.declaration.id.name);
          break;
        case "VariableDeclaration":
          const variableDeclarator = node.declaration.declarations.find(
            (d) => d.type === "VariableDeclarator"
          );
          if (!variableDeclarator) {
            throw new Error("You can't have an anonymous export");
          }
          const name =
            variableDeclarator.id.type === "Identifier"
              ? variableDeclarator.id.name
              : null;
          if (!name) {
            throw new Error("You can't have an anonymous export");
          }
          if (variableDeclarator.init?.type !== "ArrowFunctionExpression") {
            throw new Error("You can export only functions from worker");
          }
          if (!variableDeclarator.init.async) {
            throw new Error("You can't have sync functions in worker");
          }
          names.push(name);
          break;
      }
    },
  });

  return names;
}
