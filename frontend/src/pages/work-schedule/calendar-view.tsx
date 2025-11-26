import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Space, Button, message, Row, Col, Select, Popover, Radio, Alert, Spin, Grid, Tag } from "antd";
import { LeftOutlined, RightOutlined, SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { getAllWorkSchedulesAPI, createWorkScheduleAPI, updateWorkScheduleAPI, getMyWorkSchedulesAPI, createMyWorkScheduleAPI } from "@/services/api";
import type { WorkSchedule } from "@/types/workschedule";
import type { Shift } from "@/types/shift";
import { ShiftType } from "@/types/shift";
import type { Employee } from "@/types/employee";
import { useCurrentApp } from "@/components/context/app.context";
import { notifyError } from "@/utils/notification";
import "./calendar-view.scss";

const { Title } = Typography;

interface CalendarDay {
    date: Dayjs;
    schedule?: WorkSchedule;
    isCurrentMonth: boolean;
    isToday: boolean;
}

interface CalendarViewProps {
    employeeId?: string;
    shifts: Shift[];
    employees: Employee[];
    onEmployeeChange: (id?: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ employeeId, shifts, employees, onEmployeeChange }) => {
    const { user } = useCurrentApp();
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const [filteredWeekday, setFilteredWeekday] = useState<number | null>(null);

    // Local state for modified shifts before saving
    // Key: "YYYY-MM-DD", Value: shiftId or "OFF"
    const [modifiedSchedules, setModifiedSchedules] = useState<Record<string, string>>({});

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;
    // Allow Admin/HR to edit any. Employee can edit their own.
    const canEdit = isAdmin || isHR || (isEmployee && employeeId === user?.id);

    const fullDayShift = useMemo(() => shifts.find(s => s.type === ShiftType.FULL_DAY), [shifts]);

    // Load schedules
    const loadSchedules = async () => {
        if (!employeeId) {
            setSchedules([]);
            return;
        }

        setLoading(true);
        try {
            const startDate = currentMonth.startOf("month").format("YYYY-MM-DD");
            const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");

            const isViewingOwnSchedule = isEmployee && employeeId === user?.id;
            const api = isViewingOwnSchedule ? getMyWorkSchedulesAPI : getAllWorkSchedulesAPI;

            const res = await api({
                employeeId: isViewingOwnSchedule ? undefined : employeeId, // getMyWorkSchedulesAPI doesn't need employeeId
                startDate,
                endDate,
                page: 1,
                limit: 100,
            });

            if (res && typeof res === "object" && "data" in res) {
                setSchedules(res.data);
            } else {
                setSchedules(Array.isArray(res) ? res : []);
            }
            setModifiedSchedules({}); // Reset modifications on reload
        } catch (err: any) {
            notifyError(err, "Không thể tải lịch làm việc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, [currentMonth, employeeId]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");
        const startDate = startOfMonth.startOf("week");
        const endDate = endOfMonth.endOf("week");

        const days: CalendarDay[] = [];
        let currentDate = startDate;

        // Find selected employee to check type
        const selectedEmployee = employees.find(e => e.id === employeeId);
        const isFullTime = selectedEmployee?.type === 'FULL_TIME';

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            const schedule = schedules.find(
                (s) => dayjs(s.date).format("YYYY-MM-DD") === dateStr
            );

            // Default logic: If Full-time and no schedule, assume Full Day
            // But only if we have a fullDayShift
            let effectiveShiftId = schedule?.shiftId;
            if (!schedule && isFullTime && fullDayShift) {
                effectiveShiftId = fullDayShift.id;
            }

            days.push({
                date: currentDate,
                schedule: schedule ? schedule : (effectiveShiftId ? { shiftId: effectiveShiftId } as any : undefined), // Mock schedule for display if default
                isCurrentMonth: currentDate.month() === currentMonth.month(),
                isToday: currentDate.isSame(dayjs(), "day"),
            });

            currentDate = currentDate.add(1, "day");
        }

        return days;
    }, [currentMonth, schedules, employeeId, employees, fullDayShift]);

    const visibleCalendarDays = useMemo(() => {
        if (filteredWeekday === null) {
            return calendarDays;
        }
        return calendarDays.filter(
            (day) => day.isCurrentMonth && day.date.day() === filteredWeekday
        );
    }, [calendarDays, filteredWeekday]);

    const toggleWeekdayFilter = (weekdayIndex: number) => {
        setFilteredWeekday((prev) => (prev === weekdayIndex ? null : weekdayIndex));
    };

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));
    const handleToday = () => setCurrentMonth(dayjs());

    const handleShiftSelect = (dateStr: string, value: string) => {
        if (!canEdit) return;
        setModifiedSchedules((prev) => ({
            ...prev,
            [dateStr]: value,
        }));
    };

    const handleSave = async () => {
        if (!employeeId) return;

        const updates = Object.entries(modifiedSchedules);
        if (updates.length === 0) {
            message.info("Không có thay đổi nào để lưu");
            return;
        }

        setSaving(true);
        try {
            // Process in parallel
            const promises = updates.map(async ([dateStr, value]) => {
                const existingSchedule = schedules.find(
                    (s) => dayjs(s.date).format("YYYY-MM-DD") === dateStr
                );

                const shiftId = value === "OFF" ? null : value;

                if (existingSchedule) {
                    // Update - Note: Employees might not have permission to update via this API if not allowed by backend
                    // But for now we keep it as is, or we could disable update for employees if backend forbids it.
                    // Assuming updateWorkScheduleAPI is Admin/HR only based on previous findings.
                    if (isEmployee) {
                        // If employee tries to update, we might need a specific API or they can't update.
                        // For now, let's try updateWorkScheduleAPI, if it fails, we catch error.
                        // Actually, based on controller, update is Admin/HR only.
                        // So Employee cannot update.
                        throw new Error("Bạn không có quyền chỉnh sửa lịch đã đăng ký. Vui lòng liên hệ quản lý.");
                    }
                    return updateWorkScheduleAPI(existingSchedule.id, {
                        shiftId,
                    });
                } else {
                    // Create
                    if (isEmployee) {
                        return createMyWorkScheduleAPI({
                            shiftId,
                            date: dateStr,
                            note: "Đăng ký qua lịch",
                        });
                    }
                    return createWorkScheduleAPI({
                        employeeId,
                        shiftId,
                        date: dateStr,
                        note: "Đăng ký qua lịch",
                    });
                }
            });

            await Promise.all(promises);
            message.success("Lưu lịch làm việc thành công!");
            loadSchedules();
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi lưu lịch");
        } finally {
            setSaving(false);
        }
    };

    const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    return (
        <div className="work-schedule-calendar">
            <Card>
                <Spin spinning={loading}>
                    <Space direction="vertical" size={16} style={{ width: "100%" }}>
                        {/* Header Controls */}
                        <Space
                            direction={isMobile ? "vertical" : "horizontal"}
                            style={{ width: "100%", justifyContent: "space-between" }}
                            size={16}
                        >
                            <Space wrap style={{ width: isMobile ? "100%" : "auto" }}>
                                <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
                                <Title level={4} style={{ margin: 0 }}>
                                    {currentMonth.format("MMMM YYYY")}
                                </Title>
                                <Button icon={<RightOutlined />} onClick={handleNextMonth} />
                                <Button onClick={handleToday}>Hôm nay</Button>
                            </Space>

                            <Space
                                wrap
                                direction={isMobile ? "vertical" : "horizontal"}
                                style={{ width: isMobile ? "100%" : "auto" }}
                            >
                                {!isEmployee && (
                                    <Select
                                        placeholder="Chọn nhân viên"
                                        value={employeeId}
                                        onChange={onEmployeeChange}
                                        showSearch
                                        optionFilterProp="children"
                                        style={{ width: isMobile ? "100%" : 250 }}
                                        options={employees.map((emp) => ({
                                            value: emp.id,
                                            label: `${emp.fullName} (${emp.email}) - ${emp.type === 'FULL_TIME' ? 'Full-time' : 'Part-time'}`,
                                        }))}
                                    />
                                )}
                                {canEdit && (
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleSave}
                                        loading={saving}
                                        disabled={!employeeId || Object.keys(modifiedSchedules).length === 0}
                                        style={{ backgroundColor: "#a90000", borderColor: "#a90000" }} // Agribank Red
                                        block={isMobile}
                                    >
                                        Đăng ký
                                    </Button>
                                )}
                                <Button icon={<ReloadOutlined />} onClick={loadSchedules} block={isMobile} />
                            </Space>
                        </Space>

                        {!employeeId ? (
                            <Alert message="Vui lòng chọn nhân viên để xem và đăng ký lịch" type="info" showIcon />
                        ) : (
                            <div className="calendar-grid">
                                {filteredWeekday !== null && (
                                    <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", background: "#fff" }}>
                                        <Space size={8}>
                                            <Tag color="magenta">Đang lọc: {weekDays[filteredWeekday]}</Tag>
                                            <Button size="small" onClick={() => setFilteredWeekday(null)}>
                                                Bỏ lọc
                                            </Button>
                                        </Space>
                                    </div>
                                )}
                                {/* Header */}
                                <Row gutter={[0, 0]} className="calendar-header-row">
                                    {weekDays.map((day, idx) => (
                                        <Col span={24 / 7} key={idx}>
                                            <div
                                                className={`calendar-header-cell filterable ${filteredWeekday === idx ? "active" : ""}`}
                                                onClick={() => toggleWeekdayFilter(idx)}
                                            >
                                                {day}
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                {/* Body */}
                                <Row gutter={[0, 0]} className="calendar-body-row">
                                    {visibleCalendarDays.map((day, idx) => {
                                        const dateStr = day.date.format("YYYY-MM-DD");
                                        const currentShiftId = modifiedSchedules[dateStr] !== undefined
                                            ? modifiedSchedules[dateStr]
                                            : day.schedule?.shiftId;

                                        // Determine display
                                        let displayContent = null;
                                        if (currentShiftId && currentShiftId !== "OFF") {
                                            const shift = shifts.find(s => s.id === currentShiftId);
                                            if (shift) {
                                                displayContent = (
                                                    <div className="shift-tag" style={{
                                                        backgroundColor: day.schedule?.status === 'APPROVED' ? '#f6ffed' :
                                                            day.schedule?.status === 'REJECTED' ? '#fff1f0' : '#fff7e6',
                                                        border: `1px solid ${day.schedule?.status === 'APPROVED' ? '#b7eb8f' :
                                                            day.schedule?.status === 'REJECTED' ? '#ffa39e' : '#ffd591'}`,
                                                        borderRadius: 4,
                                                        padding: 2
                                                    }}>
                                                        <strong style={{
                                                            color: day.schedule?.status === 'APPROVED' ? '#389e0d' :
                                                                day.schedule?.status === 'REJECTED' ? '#cf1322' : '#d46b08'
                                                        }}>
                                                            {shift.name}
                                                        </strong>
                                                        <div style={{ fontSize: 10, color: '#666' }}>
                                                            {dayjs(shift.startTime).format("HH:mm")} - {dayjs(shift.endTime).format("HH:mm")}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }

                                        return (
                                            <Col span={24 / 7} key={idx} className={`calendar-cell ${!day.isCurrentMonth ? "other-month" : ""}`}>
                                                <div className="cell-header">
                                                    <span className={`day-number ${day.isToday ? "today" : ""}`}>
                                                        {day.date.format("D")}
                                                    </span>
                                                </div>
                                                <div className="cell-content">
                                                    {canEdit ? (
                                                        <Popover
                                                            trigger="click"
                                                            title={`Chọn ca ngày ${day.date.format("DD/MM")}`}
                                                            content={
                                                                <Radio.Group
                                                                    onChange={(e) => handleShiftSelect(dateStr, e.target.value)}
                                                                    value={currentShiftId || "OFF"}
                                                                >
                                                                    <Space direction="vertical">
                                                                        {shifts.map(s => (
                                                                            <Radio key={s.id} value={s.id}>
                                                                                {s.name} ({dayjs(s.startTime).format("HH:mm")}-{dayjs(s.endTime).format("HH:mm")})
                                                                            </Radio>
                                                                        ))}
                                                                        <Radio value="OFF">Nghỉ</Radio>
                                                                    </Space>
                                                                </Radio.Group>
                                                            }
                                                        >
                                                            <div className="shift-selector">
                                                                {displayContent || <span className="empty-slot">+</span>}
                                                            </div>
                                                        </Popover>
                                                    ) : (
                                                        <div className="shift-display">
                                                            {displayContent}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </div>
                        )}
                    </Space>
                </Spin>
            </Card>
        </div>
    );
};

export default CalendarView;
