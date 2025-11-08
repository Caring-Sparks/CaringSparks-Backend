import type { Request } from "express";
export interface MulterFiles {
  [fieldname: string]: Express.Multer.File[] | Express.Multer.File | undefined;
  "instagram.proof"?: Express.Multer.File;
  "twitter.proof"?: Express.Multer.File;
  "tiktok.proof"?: Express.Multer.File;
  "youtube.proof"?: Express.Multer.File;
  "facebook.proof"?: Express.Multer.File;
  "linkedin.proof"?: Express.Multer.File;
  "discord.proof"?: Express.Multer.File;
  "threads.proof"?: Express.Multer.File;
  "snapchat.proof"?: Express.Multer.File;
  audienceProof?: Express.Multer.File;
  media?: Express.Multer.File[];
  images?: Express.Multer.File[];
}
export interface InfluencerRequest extends Omit<Request, "files"> {
  files?: MulterFiles;
}
