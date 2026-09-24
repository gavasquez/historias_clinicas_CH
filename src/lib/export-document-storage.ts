import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "exported-documents");

function resolveStoragePath(key: string): string {
  const normalized = key.replace(/\\/g, "/");
  const absolute = path.resolve(STORAGE_ROOT, normalized);
  const root = path.resolve(STORAGE_ROOT);
  if (!absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error("Ruta de almacenamiento inválida");
  }
  return absolute;
}

export async function storeExportedDocument(
  historyId: number,
  extension: string,
  bytes: Uint8Array,
): Promise<string> {
  const key = `${historyId}/${randomUUID()}${extension}`;
  const absolute = resolveStoragePath(key);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
  return key;
}

export async function readExportedDocument(key: string): Promise<Buffer> {
  return readFile(resolveStoragePath(key));
}

export async function removeExportedDocument(key: string): Promise<void> {
  try {
    await unlink(resolveStoragePath(key));
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
  }
}
