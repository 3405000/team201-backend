import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoresService } from './stores.service'
import { StoresController } from './stores.controller'
import { Store } from './entities/store.entity'
import { UsersModule } from 'src/users/users.module'
import { Image } from 'src/s3/entities/images.entity'
import { CategoriesModule } from 'src/categories/categories.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Store]),
        TypeOrmModule.forFeature([Image]),
        UsersModule,
        CategoriesModule
    ],
    providers: [StoresService],
    controllers: [StoresController],
    exports: [StoresService]
})
export class StoresModule { }