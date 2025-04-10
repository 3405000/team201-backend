import { ReviewsService } from '../reviews/reviews.service'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateReplyDTO } from './DTO/create-reply.dto'
import { Reply as Reply } from './entities/reply.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UpdateReplyDTO } from './DTO/upate-reply.dto'

@Injectable()
export class RepliesService {
    constructor(
        @InjectRepository(Reply)
        private replyRepository: Repository<Reply>,
        private reviewsService: ReviewsService,
    ) { }

    // CREATE
    async createReply(review_id: number, createReplyDTO: CreateReplyDTO): Promise<void> {
        const foundReview = await this.reviewsService.readReviewByReviewId(review_id)
        if (foundReview.reply) {
            throw new ForbiddenException('Reply already exists for this review.')
        }

        const currentDate = new Date()

        const newReply: Reply = this.replyRepository.create({
            content: createReplyDTO.content,
            created_at: currentDate,
            updated_at: currentDate,
            review: foundReview,
        })

        await this.replyRepository.save(newReply)
        return
    }

    // READ[1] - 모든 대댓글 조회 (매니저 전용)
    async readAllReplies(): Promise<Reply[]> {
        const foundReplies = await this.replyRepository.find()

        return foundReplies
    }

    // READ[2] - 특정 리뷰 조회
    async readReplyById(reply_id: number): Promise<Reply> {
        const foundReply = await this.replyRepository.findOneBy({ reply_id: reply_id })

        if (!foundReply) {
            throw new NotFoundException(`Cannot Find reply_id: ${reply_id}`)
        }

        return foundReply
    }

    // UPDATE[1] - 리뷰 수정
    async updateReplyByReplyId(reply_id: number, updateReviewDTO: UpdateReplyDTO) {
        const foundReply = await this.readReplyById(reply_id)
        const currentDate = new Date()

        foundReply.content = updateReviewDTO.content
        foundReply.updated_at = currentDate

        await this.replyRepository.save(foundReply)
    }

    // DELETE - 대댓글 삭제
    async deleteReplyByReplyId(reply_id: number) {
        const foundReply = await this.readReplyById(reply_id)

        await this.replyRepository.remove(foundReply)
    }
}
