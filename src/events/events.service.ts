import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Event } from './entities/event.entity'
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm'
import { StoresService } from 'src/stores/stores.service'
import { CreateEventDTO } from './DTO/create-event.dto'
import { UpdateEventDTO } from './DTO/update-event.dto'

@Injectable()
export class EventsService {

    // Event 엔터티 주입
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        private storesService: StoresService
    ) { }

    // CREATE
    // 비고: 임시 시간값, 임시 스토어 id 사용
    async createEvent(store_id: number, createEventDTO: CreateEventDTO): Promise<Event> {
        const { title, description, start_date, end_date } = createEventDTO

        // 가게 객체 가져오기
        const store = await this.storesService.readStoreById(store_id)
        if (!store) {
            throw new NotFoundException(`Store with ID ${store_id} not found`)
        }

        // DTO에서 받은 값을 `Date` 객체로 변환, end_date가 명시되지 않았다면 7일 뒤로 설정
        const startDate = start_date ? new Date(start_date) : new Date()
        const endDate = end_date ? new Date(end_date) : new Date(startDate)
        if (!end_date) {
            endDate.setDate(endDate.getDate() + 7)
        }

        const newEvent: Event = this.eventRepository.create({
            store,
            title,
            description,
            start_date: startDate,
            end_date: endDate,
        })
        const createdEvent = await this.eventRepository.save(newEvent)

        return createdEvent
    }

    // READ[3] - 최근 등록 이벤트 조회 (status: ONGOING 이벤트)
    async readRecentEventByStore(store_id: number): Promise<Event> {
        const now = new Date

        const foundEvent = await this.eventRepository.findOne({
            where: {
                store: { store_id },
                start_date: LessThanOrEqual(now),
                end_date: MoreThanOrEqual(now)
            },
            order: { created_at: 'DESC' },
            relations: ['store']
        })
        if (!foundEvent) {
            throw new NotFoundException(`Cannot Find Event In This Store`)
        }

        return foundEvent
    }

    // READ[1] - 해당 가게의 모든 이벤트 조회 (생성일 기준 정렬)
    async readAllEventsByStore(store_id: number): Promise<Event[]> {
        const foundEvents = await this.eventRepository.find({
            where: { store: { store_id } },
            order: { created_at: 'DESC'},
            relations: ['store']
        })
        if (!foundEvents) {
            throw new NotFoundException(`Cannot Find Events`)
        }

        return foundEvents
    }

    // READ[2] - 특정 이벤트 상세 조회
    async readEventById(event_id: number): Promise<Event> {
        const foundEvent = await this.eventRepository.findOne({
            where: { event_id },
            relations: ['store']
        })
        if (!foundEvent) {
            throw new NotFoundException(`Cannot Find Event by Id ${event_id}`)
        }

        return foundEvent
    }

    // UPDATE - by event_id
    async updateEventById(event_id: number, updateEventDTO: UpdateEventDTO) {
        const foundEvent = await this.readEventById(event_id)

        const { title, description, start_date, end_date, is_canceled } = updateEventDTO

        foundEvent.title = title
        foundEvent.description = description
        foundEvent.start_date = start_date
        foundEvent.end_date = end_date
        foundEvent.is_canceled = is_canceled

        await this.eventRepository.save(foundEvent)
    }

    // DELETE
    async deleteEventById(event_id: number) {
        const foundEvent = await this.readEventById(event_id)

        await this.eventRepository.remove(foundEvent)
    }
}
