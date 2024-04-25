import { z } from "zod";
import { env } from "@/env";

function toMb(bytes: number) {
  return bytes / 1024 / 1024;
}

const validExtensions = ["jpg", "jpeg", "png", "gif"];

const fileSchemaBack = z
  .unknown()
  .optional()
  .transform((value) => {
    return value as File | null | undefined;
  })
  .refine(
    (file) => {
      if (!file) {
        return true;
      }

      const fileExtension = file.name.split(".").pop();

      return !!fileExtension && validExtensions.includes(fileExtension);
    },
    { message: `Valid types: ${validExtensions}` },
  )
  .refine(
    (file) => {
      if (!file) {
        return true;
      }

      return toMb(file.size) <= env.NEXT_PUBLIC_MAX_FILE_SIZE_MB;
    },
    {
      message: `File size must be less than ${env.NEXT_PUBLIC_MAX_FILE_SIZE_MB}MB`,
    },
  );

const fileSchemaFront = z
  .unknown()
  .transform((value) => {
    return value as FileList | null | undefined;
  })
  .transform((value) => value?.item(0))
  .refine(
    (file) => {
      if (!file) {
        return true;
      }

      const fileExtension = file.name.split(".").pop();

      return !!fileExtension && validExtensions.includes(fileExtension);
    },
    { message: `Valid types: ${validExtensions}` },
  )
  .refine(
    (file) => {
      if (!file) {
        return true;
      }

      return toMb(file.size) <= env.NEXT_PUBLIC_MAX_FILE_SIZE_MB;
    },
    {
      message: `File size must be less than ${env.NEXT_PUBLIC_MAX_FILE_SIZE_MB}MB`,
    },
  );

function arrayBufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

export { fileSchemaBack, fileSchemaFront, arrayBufferToHex, hexToArrayBuffer };
