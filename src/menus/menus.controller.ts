import { ApiResponseDTO } from 'src/common/api-reponse-dto/api-response.dto'
import { CreateMenuDTO } from './DTO/create-menu.dto'
import { MenusService } from './menus.service'
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common'
import { Menu } from './entities/menu.entity'
import { ReadAllMenusDTO } from './DTO/read-all-menus.dto'
import { ReadMenuDTO } from './DTO/read-menu.dto'
import { UpdateMenuDTO } from './DTO/update-menu.dto'
import { RolesGuard } from 'src/common/custom-decorators/custom-role.guard'
import { AuthGuard } from '@nestjs/passport'
import { Roles } from 'src/common/custom-decorators/roles.decorator'
import { UserRole } from 'src/users/entities/user-role.enum'

@Controller('api/stores/:store_id/menus')
@UseGuards(AuthGuard('jwt'), RolesGuard) // JWT인증, roles guard 적용
export class MenusController {
    constructor(private menusService: MenusService) { }

    // CREATE - 새로운 메뉴 등록
    // 미구현: logger
    @Post('/')
    @Roles(UserRole.MANAGER)
    async createMenu(
        @Param('store_id') store_id: number,
        @Body() createMenuDTO: CreateMenuDTO): Promise<ApiResponseDTO<Menu>> {
        await this.menusService.createMenu(store_id, createMenuDTO)

        return new ApiResponseDTO(true, HttpStatus.CREATED, 'Menu Registered Successfully!')
    }

    // READ[1] - 해당 가게 모든 메뉴 조회
    // 미구현: logger
    @Get('/')
    async readMenusByStore(@Param('store_id') store_id: number): Promise<ApiResponseDTO<ReadAllMenusDTO[]>> {
        const menus: Menu[] = await this.menusService.readMenusByStore(store_id)
        const readAllMenusDTO = menus.map(menu => new ReadAllMenusDTO(menu))

        return new ApiResponseDTO(true, HttpStatus.OK, 'Successfully Retrieved All Menus!', readAllMenusDTO)
    }

    // READ[2] - 해당 가게 특정 메뉴 조회
    // 미구현: logger
    @Get('/:menu_id')
    async readMenuById(
        @Param('menu_id') menu_id: number): Promise<ApiResponseDTO<ReadMenuDTO>> {
        const foundMenu: Menu = await this.menusService.readMenuById(menu_id)

        return new ApiResponseDTO(true, HttpStatus.OK, 'Successfully Retrieved Event!', new ReadMenuDTO(foundMenu))
    }

    // UPDATE - by menu_id
    // 미구현: logger
    @Put('/:menu_id')
    @Roles(UserRole.MANAGER)
    async updateMenuById(
        @Param('menu_id') menu_id: number,
        @Body() updateMenuDTO: UpdateMenuDTO): Promise<ApiResponseDTO<void>> {
        await this.menusService.updateMenuById(menu_id, updateMenuDTO)

        return new ApiResponseDTO(true, HttpStatus.NO_CONTENT, 'Menu Updated Successfully!')
    }

    // DELETE - by menu_id
    // 미구현: logger
    @Delete('/:menu_id')
    @Roles(UserRole.MANAGER)
    async deleteMenuById(
        @Param('menu_id') menu_id: number): Promise<ApiResponseDTO<void>> {
        await this.menusService.deleteMenuById(menu_id)

        return new ApiResponseDTO(true, HttpStatus.NO_CONTENT, 'Menu Deleted Successfully!')
    }
}
