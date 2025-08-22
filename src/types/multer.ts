import type { Request } from "express";
import type { File as MulterFile } from "multer";

// Define the structure of files we expect from multer
export interface MulterFiles {
  [fieldname: string]: MulterFile[] | MulterFile | undefined;
  "instagram.proof"?: MulterFile;
  "twitter.proof"?: MulterFile;
  "tiktok.proof"?: MulterFile;
  "youtube.proof"?: MulterFile;
  audienceProof?: MulterFile;
}

// Extend Express Request to include our specific file structure
export interface InfluencerRequest extends Request {
  files?: MulterFiles;
}
