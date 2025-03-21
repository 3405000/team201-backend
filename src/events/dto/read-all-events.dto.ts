import { EventStatus } from "../entities/event-status.enum"
import { Event } from "../entities/event.entity"

// 이벤트 목록을 조회할 때 사용하는 Dto
// description 필드 존재하지 않음.
export class ReadAllEventsDTO {
    title: string
    start_date: Date
    end_date: Date
    event_status: EventStatus
    description: string
    created_at: Date

    constructor(event: Event) {
        this.title = event.title
        this.start_date = event.start_date
        this.end_date = event.end_date
        this.event_status = event.eventStatus
        this.description = event.description
        this.created_at = event.created_at
    }
}