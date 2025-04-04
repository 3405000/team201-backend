import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ReviewsService } from './reviews.service'
import { ReviewsController } from './reviews.controller'
import { Review } from './entites/review.entity'
import { StoresModule } from 'src/stores/stores.module'
import { UsersModule } from 'src/users/users.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Review]),
        StoresModule,
        UsersModule,
    ],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [ReviewsService]
})
export class ReviewsModule { }