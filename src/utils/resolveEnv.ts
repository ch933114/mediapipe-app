const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/;

/** Unreplaced scaffold placeholders fall back so template can run `pnpm dev`. / 未替換的 scaffold 佔位符回退，讓 template 可直接 pnpm dev */
export function resolveEnvValue(
  value: string | undefined,
  fallback = ""
): string {
  const trimmed = value?.trim();
  if (!trimmed || PLACEHOLDER_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}
