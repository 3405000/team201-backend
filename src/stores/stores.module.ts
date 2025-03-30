import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StoresService } from './stores.service'
import { StoresController } from './stores.controller'
import { Store } from './entities/store.entity'
import { UsersModule } from 'src/users/users.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Store]),
        UsersModule,
    ],
    providers: [StoresService],
    controllers: [StoresController],
    exports: [StoresService]
})
export class StoresModule { }
