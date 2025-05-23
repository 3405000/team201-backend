import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable, Logger } from '@nestjs/common'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { File } from './entities/file.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UploadType } from './entities/upload-type.enum'
import { Review } from 'src/reviews/entites/review.entity'
import { v4 as uuidv4 } from 'uuid'
import { Store } from 'src/stores/entities/store.entity'
import { User } from 'src/users/entities/user.entity'
import { Event } from 'src/events/entities/event.entity'

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

        https://
        /* 에러 점검*/
        console.log('AWS_S3_ACCESS_KEY:', process.env.AWS_S3_ACCESS_KEY)
        console.log('AWS_S3_SECRET_ACCESS_KEY:', process.env.AWS_S3_SECRET_ACCESS_KEY)
        console.log('AWS_REGION:', process.env.AWS_REGION)
        console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET)

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

    // public 파일 업로드
    async uploadImage(
        files: Express.Multer.File[],
        targetEntity: Review | Store | User | Event,
        uploadType: UploadType
    ): Promise<File[]> {
        this.logger.log(`uploadFile START`)

        const uploadedFiles: File[] = []

        try {
            for (const file of files) {
                // uuid를 통해 파일명 중복 방지
                const uuid = uuidv4()

                // 파일 확장자 추출
                const ext = path.extname(file.originalname)

                // S3에 저장될 최종 파일 이름
                const folderPrefix = this.getFolderByUploadType(uploadType)
                const s3FileName = `public/${folderPrefix}/${uuid}${ext}`

                // S3에 업로드 할 객체
                const uploadParams = {
                    Bucket: this.bucketName,
                    Key: s3FileName,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                }
                await this.s3Client.send(new PutObjectCommand(uploadParams))

                const region = process.env.AWS_REGION

                // DB에 저장할 url / 파일명(한글깨짐) 생성
                const url = `${process.env.AWS_DOMAIN}/${s3FileName}`
                const dbFileName = file.originalname

                // DB에 저장
                const fileData: Partial<File> = {
                    file_name: dbFileName,
                    url: url,
                    content_type: file.mimetype,
                    upload_type: uploadType,
                }
                switch (uploadType) {
                    case UploadType.REVIEW_IMAGE:
                        fileData.review = targetEntity as Review
                        break
                    // 추후 구현 완료 시 주석 해제
                    // case UploadType.STORE_PROFILE:
                    //     fileData.store = targetEntity as Store
                    //     break
                    case UploadType.PROFILE_IMG:
                        fileData.user = targetEntity as User
                        break
                    // case UploadType.EVENT_IMAGE:
                    //     fileData.event = targetEntity as Event
                    //     break
                    default:
                        this.logger.warn(`Unknown upload type: ${uploadType}`)
                }
                const fileEntity = this.fileRepository.create(fileData)

                const savedFile = await this.fileRepository.save(fileEntity)
                uploadedFiles.push(savedFile)
            }
        } catch (error) {
            this.logger.error('Error uploading files:', error)
            throw new Error('Failed to upload files')
        }

        this.logger.log(`uploadFile END`)
        return uploadedFiles
    }

    async updateUserProfileImage(
        newFile: Express.Multer.File,
        user: User
    ): Promise<File> {
        this.logger.log('updateUserProfileImage START');
    
        // 1. 기존 프로필 이미지 조회
        const existingFile = await this.fileRepository.findOne({
            where: {
                user: { user_id: user.user_id },
                upload_type: UploadType.PROFILE_IMG
            },
            relations: ['user']
        });
    
        // 2. 기존 이미지가 있다면 삭제
        if (existingFile) {
            const isDefault = existingFile.file_name.includes('default-profile');
    
            if (!isDefault) {
                // S3에서 삭제
                const s3Key = existingFile.url.split('.com/')[1];
                await this.deleteImage(s3Key);
            }
    
            // DB에서도 삭제 (default든 아니든)
            await this.fileRepository.delete({ file_id: existingFile.file_id });
        }
    
        // 3. 새로운 이미지 업로드
        const uploaded = await this.uploadImage([newFile], user, UploadType.PROFILE_IMG);
        
        this.logger.log('updateUserProfileImage END');
        return uploaded[0];
    }
    

    // 파일 삭제
    async deleteImage(file_name: string): Promise<string> {
        this.logger.log(`deleteFile START`)

        const deleteParams = {
            Bucket: this.bucketName,
            Key: file_name,
        }

        await this.s3Client.send(new DeleteObjectCommand(deleteParams))

        // DB에서 삭제
        await this.fileRepository.delete({ file_name })

        this.logger.log(`deleteFile END`)
        return `File ${file_name} deleted successfully`
    }

    private getFolderByUploadType(uploadType: UploadType): string {
        switch (uploadType) {
            case UploadType.REVIEW_IMAGE:
                return 'review'
            case UploadType.PROFILE_IMG:
                return 'profile_img'
            case UploadType.STORE_PROFILE:
                return 'store'
            case UploadType.EVENT_IMAGE:
                return 'event'
            default:
                return 'etc'
        }
    }

    async createDefaultProfileImage(user: User): Promise<File> {
        const defaultFile: Partial<File> = {
            file_name: 'default-profile.jpg',
            url: 'https://team-201.s3.ap-northeast-2.amazonaws.com/public/profile_img/default-profile.jpg',
            content_type: 'image/jpg',
            upload_type: UploadType.PROFILE_IMG,
            user: user
        }

        const fileEntity = this.fileRepository.create(defaultFile)
        return await this.fileRepository.save(fileEntity)
    }
}
