import { injectable } from 'inversify';
import JSZip from 'jszip';
import Result from '../../../../infrastructure/result/result';
import { ZipArchiveCreatorPort, ArchiveFile } from '../../application/ports/zip-archive-creator.port';

@injectable()
export class ZipArchiveCreatorAdapter implements ZipArchiveCreatorPort {
  async createArchive(files: ArchiveFile[]): Promise<Result<Buffer, Error>> {
    try {
      const zip = new JSZip();

      // Добавляем файлы в архив
      for (const file of files) {
        zip.file(file.filename, file.content, {
          // Устанавливаем MIME тип если возможно
          binary: false, // Все файлы текстовые
          compression: 'DEFLATE',
          compressionOptions: {
            level: 6 // Средний уровень сжатия
          }
        });
      }

      // Генерируем ZIP буфер
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      return Result.success(zipBuffer);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during ZIP creation';
      return Result.failure(new Error(`Failed to create ZIP archive: ${message}`));
    }
  }
}