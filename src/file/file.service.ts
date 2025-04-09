import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable, Logger } from '@nestjs/common'
import * as dotenv from 'dotenv'
import { File } from './entities/file.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UploadType } from './entities/upload-type.enum'
import { Review } from 'src/reviews/entites/review.entity'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name)

    s3Client: S3Client
    private bucketName: string

    constructor(
        @InjectRepository(File)
        private fileRepository: Repository<File>,
    ) {
        const accessKeyId = process.env.AWS_S3_ACCESS_KEY
        const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY
        const region = process.env.AWS_REGION
        this.bucketName = String(process.env.AWS_S3_BUCKET)

        if (!accessKeyId || !secretAccessKey || !region || !this.bucketName) {
            throw new Error('Missing AWS S3 environment variables')
        }

        // AWS S3 클라이언트 초기화. 환경 설정 정보를 사용하여 AWS 리전, Access Key, Secret Key를 설정.
        this.s3Client = new S3Client({
            region: region, // AWS Region
            credentials: {
                accessKeyId: accessKeyId, // Access Key
                secretAccessKey: secretAccessKey, // Secret Key
            },
        })
    }

    // 파일 업로드
    async uploadImage(files: Express.Multer.File[], createdReview: Review): Promise<File[]> {
        const uploadedFiles: File[] = []

        try {
            for (const file of files) {
                // uuid를 통해 파일명 중복을 방지
                const uuid = uuidv4()
                const originalName = file.originalname
                    .replace(/[^a-zA-Z0-9._-]/g, '_')  // 허용되지 않는 문자를 '_'로
                    .replace(/_+/g, '_')               // 연속된 '_'를 하나로 압축
                // s3에 저장될 최종 파일 이름
                const filename = `${uuid}_${originalName}`

                const uploadParams = {
                    Bucket: this.bucketName,
                    Key: filename,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }

                await this.s3Client.send(new PutObjectCommand(uploadParams))

                const region = process.env.AWS_REGION

                // DB에 저장할 url 생성
                const url = `https://${this.bucketName}.s3.${region}.amazonaws.com/${filename}`
                // DB에 저장
                const fileEntity = this.fileRepository.create({
                    file_name: filename,
                    url: url,
                    content_type: file.mimetype,
                    upload_type: UploadType.REVIEW_IMAGE,
                    review: createdReview,
                })

                const savedFile = await this.fileRepository.save(fileEntity)
                uploadedFiles.push(savedFile)
            }
        } catch (error) {
            this.logger.error('Error uploading images:', error)
            throw new Error('Failed to upload images')
        }

        return uploadedFiles
    }

    // 파일 삭제
    async deleteImage(file_name: string): Promise<string> {
        const deleteParams = {
            Bucket: this.bucketName,
            Key: file_name,
        }

        await this.s3Client.send(new DeleteObjectCommand(deleteParams))

        // DB에서 삭제
        await this.fileRepository.delete({ file_name })

        return `File ${file_name} deleted successfully`
    }
}
