import type { Request } from "express";
export interface MulterFiles {
  [fieldname: string]: Express.Multer.File[] | Express.Multer.File | undefined;
  "instagram.proof"?: Express.Multer.File;
  "twitter.proof"?: Express.Multer.File;
  "tiktok.proof"?: Express.Multer.File;
  "youtube.proof"?: Express.Multer.File;
  "facebook.proof"?: Express.Multer.File;
  audienceProof?: Express.Multer.File;
}
export interface InfluencerRequest extends Omit<Request, "files"> {
  files?: MulterFiles;
}
