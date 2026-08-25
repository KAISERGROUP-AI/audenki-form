// フォームデータ内の値を "usageAddress.postalCode" のようなドット区切りの
// パス文字列で取得・更新するための小さなユーティリティです。

export function getByPath(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  return typeof value === "string" ? value : "";
}

export function setByPath<T extends object>(obj: T, path: string, value: string): T {
  const keys = path.split(".");
  const clone: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  let cursor = clone;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
    } else {
      const next = cursor[key];
      const nextClone =
        next && typeof next === "object" ? { ...(next as Record<string, unknown>) } : {};
      cursor[key] = nextClone;
      cursor = nextClone;
    }
  });

  return clone as T;
}
