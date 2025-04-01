"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_FILES_DIR = "uploads";

async function ensureUploadsFolder() {
  const uploadDir = path.join(process.cwd(), UPLOAD_FILES_DIR);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
}

export async function saveFileToDisk(file: File) {
  ensureUploadsFolder();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadDir = path.join(process.cwd(), UPLOAD_FILES_DIR);
  const filePath = path.join(uploadDir, file.name);

  await writeFile(filePath, buffer);

  return { success: true, message: `File saved at ${filePath}` };
}
