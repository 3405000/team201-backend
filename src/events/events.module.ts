import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { Event } from './entities/event.entity'
import { StoresModule } from 'src/stores/stores.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([Event]),
        StoresModule
    ],
    providers: [EventsService],
    controllers: [EventsController],
    exports: [EventsService],
})
export class EventsModule { }
