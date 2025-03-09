import { UpdateReviewDTO } from './DTO/update-review.dto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Review } from './entites/review.entity'
import { Repository } from 'typeorm'
import { CreateReviewDTO } from './DTO/create-review.dto'
import { StoresService } from 'src/stores/stores.service'
import { ReviewReply } from 'src/review-replies/entities/review-reply.entity'

@Injectable()
export class ReviewsService {
    // !!!! relations가 반복되는데, 한 곳에서 불러오는 식으로 쓰고싶음. service 내에 배열 만들어서 보관해도 ㄱㅊ은지?
    // !!!! user 수정 완료되면 relation에 추가해야됨
    private reviewRelations = ["reply", "store"]

    constructor(
        // Review 엔터티 주입
        @InjectRepository(Review)
        private reviewRepository: Repository<Review>,
        private storesService: StoresService
    ) { }

    // CREATE [1]
    // 미구현: logger, 에러 처리
    // 비고: store_id, user_id, keywords는 원래 DTO로 전달해야 한다. 지금은 안되므로 임시값 사용.
    async createReview(CreateReviewDTO: CreateReviewDTO): Promise<void> {
        const { store_id, user_id, content } = CreateReviewDTO

        // 임시 user_id
        const tempUserId: number = 1

        // store_id로 Store 객체 가져오기
        const store = await this.storesService.readStoreById(store_id)

        const currentDate: Date = new Date()

        const newReview: Review = this.reviewRepository.create({
            store,
            user_id: tempUserId,
            content,
            created_at: currentDate,
            updated_at: currentDate,
        })

        await this.reviewRepository.save(newReview)
    }

    // READ[1] - 모든 리뷰 조회
    // 미구현: logger, 에러 처리
    async readAllReviews(): Promise<Review[]> {
        const foundReviews = await this.reviewRepository.find({
            relations: this.reviewRelations,
        })

        return foundReviews
    }

    // READ[2] - 특정 리뷰 조회
    async readReviewById(review_id: number): Promise<Review> {
        const foundReview = await this.reviewRepository.findOne({
            where: { review_id },
            // reply 관계를 포함하여 조회
            relations: this.reviewRelations, 
        })
        if (!foundReview) {
            throw new NotFoundException(`Cannot Find Review with Id ${review_id}`)
        }

        return foundReview
    }
    
    // READ[3] - 사용자로 리뷰 필터링
    async readReviewsByUser(user_id: number): Promise<Review[]> {
        // !!!! user 수정되면 검색 방식 교체해야됨 (아래 readReviewsByStore 형식 참고)
        const foundReviews = await this.reviewRepository.findBy({ user_id: user_id })

        return foundReviews
    }

    // READ[4] - 가게로 리뷰 필터링
    // async readReviewsByStore(store_id: number): Promise<Review[]> {
    //     // store_id로 Store 객체 가져오기
    //     // const store = await this.storesService.readStoreById(store_id)

    //     // const foundReviews = await this.reviewRepository.find({
    //     //     where: { store },
    //     //     relations: this.reviewRelations,
    //     // })

    //     // return foundReviews
    // }

    // UPDATE[1] - 리뷰 수정
    // 미구현: logger, 에러 처리
    async updateReviewByReviewId(review_id: number, updateReviewDTO: UpdateReviewDTO): Promise<void> {
        const foundReview = await this.readReviewById(review_id)

        const currentDate: Date = new Date()

        foundReview.content = updateReviewDTO.content
        foundReview.updated_at = currentDate

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
    async markHelpful(review_id: number): Promise<void> {
        const foundReview = await this.readReviewById(review_id)

        foundReview.helpful_count += 1
        await this.reviewRepository.save(foundReview)
    }

    // UPDATE[3] - 리뷰 대댓글 달릴 시 해당 대댓글 id 업데이트
    async updateReviewReplyId(review_id: number, reply: ReviewReply): Promise<void> {
        const foundReview = await this.readReviewById(review_id)
        foundReview.reply = reply

        await this.reviewRepository.save(foundReview)
    }

    // DELETE - 리뷰 삭제
    // 미구현: logger, 에러 처리
    async deleteReveiwById(review_id: number): Promise<void> {
        const foundReview = await this.readReviewById(review_id)

        await this.reviewRepository.remove(foundReview)
    }
}
