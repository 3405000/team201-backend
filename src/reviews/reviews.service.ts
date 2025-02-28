import { CreateReviewReplyDTO } from './DTO/create-review-reply.dto'
import { UpdateReviewDTO } from './DTO/update-review.dto'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Review } from './entites/review.entity'
import { Repository } from 'typeorm'
import { CreateReviewDTO } from './DTO/create-review.dto'
import { StoresService } from 'src/stores/stores.service'
import { ReviewReply } from './entites/review-reply.entity'

@Injectable()
export class ReviewsService {

    constructor(
        // Review 엔터티 주입
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,

        // ReviewReply 엔터티 주입
        @InjectRepository(ReviewReply)
        private reviewReplyRepository: Repository<ReviewReply>,

        private storesService: StoresService
    ) { }

    // CREATE [1]
    // 미구현: logger, 에러 처리
    // 비고: store_id, user_id, keywords는 원래 DTO로 전달해야 한다. 지금은 안되므로 임시값 사용.
    async createReview(CreateReviewDTO: CreateReviewDTO): Promise<Review> {
        const { store_id, user_id, content } = CreateReviewDTO

        // 임시 user_id
        const tempUserId: number = 1

        // Store 객체에서 store_id가져오기
        const store = await this.storesService.getStoreById(store_id)
        if (!store) {
            throw new NotFoundException(`Store with ID ${store_id} not found`)
        }

        const currentDate: Date = await new Date()

        const newReview: Review = this.reviewRepository.create({
            store,
            user_id: tempUserId,
            content,
            created_at: currentDate,
            updated_at: currentDate,
        })

        const createdEvent: Review = await this.reviewRepository.save(newReview)

        return createdEvent
    }

    // CREATE [2]
    // 미구현; logger, 에러 처리
    async createReviewReply(review_id: number, CreateReviewReplyDTO: CreateReviewReplyDTO): Promise<ReviewReply> {
        const foundReview = await this.reviewRepository.findOne({ where: { review_id: review_id } })

        if (!foundReview) {
            throw new NotFoundException(`Cannot found review_id: ${review_id}`)
        }

        if (foundReview.reply_received) {
            throw new ForbiddenException('이미 매니저 대댓글이 등록되어 있습니다.')
        }
        foundReview.reply_received = true
        await this.reviewRepository.save(foundReview)


        const currentDate = await new Date()

        const newReviewReply: ReviewReply = this.reviewReplyRepository.create({
            content: CreateReviewReplyDTO.content,
            created_at: currentDate,
            updated_at: currentDate,
            review: foundReview,
        })

        const createdReviewReply: ReviewReply = await this.reviewReplyRepository.save(newReviewReply)

        return createdReviewReply
    }

    // READ - 모든 리뷰 조회
    // 미구현: logger, 에러 처리
    async readAllReviews(): Promise<Review[]> {

        const foundReviews = await this.reviewRepository.find()

        return foundReviews
    }

    // UPDATE[1] - 리뷰 수정
    // 미구현: logger, 에러 처리
    async updateReviewByReviewId(review_id: number, UpdateReviewDTO: UpdateReviewDTO) {
        const foundReview = await this.reviewRepository.findOne({ where: { review_id } })

        if (!foundReview) {
            throw new NotFoundException(`Cannot Find review_id: ${review_id}`)
        }

        const currentDate: Date = await new Date()

        foundReview.content = UpdateReviewDTO.content
        foundReview.updated_at = currentDate
        foundReview.isModified = true

        await this.reviewRepository.save(foundReview)
    }

    // UPDATE[2] - 리뷰 도움됐어요 반응
    // 미구현: logger, 에러 처리
    /**
     * 비고
     * 1. 한번만 누를 수 있게, 취소는 불가능
     *    취소 되게하려면 복잡해지기 때문에 일단 이렇게
     * 
     * 2. 버튼을 이미 눌렀는지 확인하는 로직은 프론트에서 구현하기
     *    백엔드에서도 2차적으로 필터링하면 좋겠지만
     *    리뷰 엔터티에 좋아요 누른 사람 배열을 추가해야 함.
     */
    async markHelpful(review_id: number) {
        const foundReview = await this.reviewRepository.findOne({ where: { review_id } })

        if (!foundReview) {
            throw new NotFoundException(`Cannot Find review_id: ${review_id}`)
        }
        foundReview.helpful_count += 1
        await this.reviewRepository.save(foundReview)
    }

    // DELETE - 리뷰 삭제
    // 미구현: logger, 에러 처리
    async deleteReveiwById(review_id: number) {
        const foundReview = await this.reviewRepository.findOne({ where: { review_id } })

        if (!foundReview) {
            throw new NotFoundException(`Cannot Find review_id: ${review_id}`)
        }

        await this.reviewRepository.remove(foundReview)
    }
}
