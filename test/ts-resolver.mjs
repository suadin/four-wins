// Resolves extensionless TypeScript imports for the Node test runner.
// Angular writes `./game.types`; Node wants the extension.
export async function resolve(specifier, context, next) {
  const target = specifier.startsWith('.') && !/\.(ts|js|mjs|cjs|json)$/i.test(specifier)
    ? `${specifier}.ts`
    : specifier;
  return next(target, context);
}
