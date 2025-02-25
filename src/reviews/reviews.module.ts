import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entites/review.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review])
    ],
    providers: [ReviewsService],
    controllers: [ReviewsController],
})
export class ReviewsModule { }