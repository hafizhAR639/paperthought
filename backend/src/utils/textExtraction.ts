import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import type { Express } from "express";

type UploadedFile = Express.Multer.File;

function isPdfFile(file: UploadedFile): boolean {
  return (
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf")
  );
}

function isDocxFile(file: UploadedFile): boolean {
  return (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.originalname.toLowerCase().endsWith(".docx")
  );
}

export function inferPaperTitle(fileName: string, content: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  if (baseName) {
    return baseName;
  }

  const firstLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine ? firstLine.slice(0, 120) : "Untitled Paper";
}

export async function extractTextFromUploadedFile(
  file: UploadedFile,
): Promise<string> {
  if (isPdfFile(file)) {
    const data = await pdfParse(file.buffer);
    return data.text.trim();
  }

  if (isDocxFile(file)) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.trim();
  }

  return file.buffer.toString("utf-8").trim();
}
