import type { SchemaManifest } from './discover.ts';

export function resolve(manifests: SchemaManifest[]): string[] {
  const byPackage = new Map<string, SchemaManifest>();
  for (const m of manifests) {
    byPackage.set(m.package, m);
  }

  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const m of manifests) {
    if (!inDegree.has(m.package)) inDegree.set(m.package, 0);
    if (!adjacency.has(m.package)) adjacency.set(m.package, []);

    for (const dep of m.after) {
      inDegree.set(m.package, (inDegree.get(m.package) ?? 0) + 1);
      if (!adjacency.has(dep)) adjacency.set(dep, []);
      adjacency.get(dep)!.push(m.package);
    }
  }

  const queue: string[] = [];
  for (const [pkg, degree] of inDegree) {
    if (degree === 0) queue.push(pkg);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const pkg = queue.shift()!;
    sorted.push(pkg);
    for (const dependent of adjacency.get(pkg) ?? []) {
      const next = (inDegree.get(dependent) ?? 0) - 1;
      inDegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }

  if (sorted.length !== manifests.length) {
    const cycle = [...inDegree.entries()]
      .filter(([, d]) => d > 0)
      .map(([pkg]) => pkg)
      .join(', ');
    throw new Error(`Circular dependency detected among: ${cycle}`);
  }

  return sorted.flatMap((pkg) => byPackage.get(pkg)?.schemas ?? []);
}
