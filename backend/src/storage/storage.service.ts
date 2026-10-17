import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class StorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadImmagine(file: Express.Multer.File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'segnalazioni', resource_type: 'image' },
          (err, result) => {
            if (err || !result) {
              reject(
                new InternalServerErrorException('Upload immagine fallito'),
              );
              return;
            }

            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }
}
