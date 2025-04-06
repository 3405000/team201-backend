import { Reply } from "src/replies/entities/reply.entity"
import { ReviewImage } from "src/s3/entities/review-image.entity"
import { Store } from "src/stores/entities/store.entity"
import { User } from "src/users/entities/user.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    review_id: number

    @ManyToOne(() => Store, (store) => store.reviews)
    @JoinColumn({ name: "store_id" })
    store: Store

    @ManyToOne(() => User, (user) => user.reviews)
    @JoinColumn({ name: "user_id" })
    user: User

    @Column()
    content: string

    @CreateDateColumn({ type: "timestamp" })
    created_at: Date

    @CreateDateColumn({ type: "timestamp" })
    updated_at: Date

    @Column({ default: 0 })
    helpful_count: number

    @OneToOne(() => Reply, (reply) => reply.review, { cascade: true, nullable: true })
    reply: Reply

    @OneToMany(() => ReviewImage, ri => ri.review, { cascade: true })
    review_images: ReviewImage[]

    get isModified(): boolean {
        return this.created_at.getTime() !== this.updated_at.getTime()
    }
}
