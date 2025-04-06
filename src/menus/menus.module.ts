import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenusService } from './menus.service'
import { Menu } from './entities/menu.entity'
import { MenusController } from './menus.controller'
import { StoresModule } from 'src/stores/stores.module'
import { Image } from 'src/s3/entities/images.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([Menu]),
        TypeOrmModule.forFeature([Image]),
        StoresModule,
    ],
    providers: [MenusService],
    controllers: [MenusController],
    exports: [MenusService],
})
export class MenusModule { }
