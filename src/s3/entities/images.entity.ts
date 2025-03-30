import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({ name: 'images' })
export class Image {
    @PrimaryGeneratedColumn()
    image_id: number

    // S3에 저장된 파일명
    @Column()
    file_name: string

    // S3에서 접근 가능한 파일 URL
    @Column()
    url: string

    // 파일의 MINE type (png, jpeg...)
    @Column()
    content_type: string

    @CreateDateColumn()
    created_at: Date
}