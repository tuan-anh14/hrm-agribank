import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/decorator/customize';
import { Role } from '@prisma/client';

@ApiTags('Payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayrollController {
    constructor(private readonly payrollService: PayrollService) { }

    @Post('generate')
    @Roles(Role.ADMIN, Role.HR)
    @ApiOperation({ summary: 'Tạo bảng lương cho tất cả nhân viên' })
    @ApiBody({
        description: 'Thông tin tháng/năm cần tạo bảng lương',
        schema: {
            type: 'object',
            properties: {
                month: {
                    type: 'number',
                    example: 11,
                    description: 'Tháng (1-12)'
                },
                year: {
                    type: 'number',
                    example: 2025,
                    description: 'Năm'
                }
            },
            required: ['month', 'year']
        }
    })
    async generate(@Body() body: { month: number; year: number }) {
        return this.payrollService.generatePayrollForMonth(body.month, body.year);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR)
    @ApiOperation({ summary: 'Lấy danh sách bảng lương' })
    @ApiQuery({ name: 'employeeId', required: false, description: 'Lọc theo ID nhân viên' })
    @ApiQuery({ name: 'month', required: false, description: 'Lọc theo tháng' })
    @ApiQuery({ name: 'year', required: false, description: 'Lọc theo năm' })
    async getAll(@Query() query: any) {
        const filters: any = {};
        if (query.employeeId) filters.employeeId = query.employeeId;
        if (query.month) filters.month = parseInt(query.month);
        if (query.year) filters.year = parseInt(query.year);

        return this.payrollService.getAll(filters);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Lấy chi tiết bảng lương' })
    @ApiParam({ name: 'id', description: 'ID của bảng lương' })
    async getById(@Param('id') id: string) {
        return this.payrollService.getById(id);
    }

    @Patch(':id/status')
    @Roles(Role.ADMIN, Role.HR)
    @ApiOperation({ summary: 'Cập nhật trạng thái bảng lương (Duyệt/Từ chối)' })
    @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: ['approved', 'rejected'] } } } })
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.payrollService.updateStatus(id, status);
    }

    @Post(':id/pay')
    @Roles(Role.ADMIN, Role.HR)
    @ApiOperation({ summary: 'Thanh toán lương' })
    async pay(@Param('id') id: string) {
        return this.payrollService.pay(id);
    }
}
