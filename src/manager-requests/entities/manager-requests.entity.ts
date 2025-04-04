import { RequestStatus } from "src/common/request-status.enum"
import { Store } from "src/stores/entities/store.entity"
import { User } from "src/users/entities/user.entity"
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class ManagerRequest {
    @PrimaryGeneratedColumn()
    request_id: number

    @ManyToOne(()=> User, { eager: false })
    @JoinColumn({ name: "user_id" })
    user: User

    @ManyToOne(() => Store, { eager: false })
    @JoinColumn({ name: "store_id" })
    store: Store

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date

    @Column()
    status: RequestStatus

    @Column({ nullable: true })
    remark: string // 비고 (거절 시 사유)
}