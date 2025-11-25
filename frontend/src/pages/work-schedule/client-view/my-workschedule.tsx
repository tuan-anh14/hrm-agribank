import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Space, Button, Spin, Alert, Tag, Row, Col, Modal, Badge } from "antd";
import { LeftOutlined, RightOutlined, PlusOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getMyWorkSchedulesAPI } from "@/services/api";
import type { WorkSchedule, WorkScheduleStatus } from "@/types/workschedule";
import { useIsMobile } from "@/hooks/useResponsive";
import "./my-workschedule.scss";

const { Title, Text } = Typography;

interface CalendarDay {
    date: Dayjs;
    schedules: WorkSchedule[];
    isCurrentMonth: boolean;
    isToday: boolean;
}

const STATUS_COLORS: Record<WorkScheduleStatus, string> = {
    PENDING: "orange",
    APPROVED: "green",
    REJECTED: "red",
};

const STATUS_LABELS: Record<WorkScheduleStatus, string> = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
};

const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const MyWorkSchedulePage: React.FC = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Tạo calendar grid
    const calendarDays = useMemo(() => {
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");
        const startDate = startOfMonth.startOf("week");
        const endDate = endOfMonth.endOf("week");

        const days: CalendarDay[] = [];
        let currentDate = startDate;

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            const daySchedules = schedules.filter(
                (schedule) => dayjs(schedule.date).format("YYYY-MM-DD") === dateStr
            );

            days.push({
                date: currentDate,
                schedules: daySchedules,
                isCurrentMonth: currentDate.month() === currentMonth.month(),
                isToday: currentDate.isSame(dayjs(), "day"),
            });

            currentDate = currentDate.add(1, "day");
        }

        return days;
    }, [currentMonth, schedules]);

    // Load schedules
    const loadSchedules = async () => {
        setLoading(true);
        setError(null);

        try {
            const startDate = currentMonth.startOf("month").format("YYYY-MM-DD");
            const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");

            const res = await getMyWorkSchedulesAPI({
                startDate,
                endDate,
                page: 1,
                limit: 100,
            });

            if (res && typeof res === "object" && "data" in res) {
                setSchedules(res.data || []);
            } else {
                setSchedules(Array.isArray(res) ? res : []);
            }
        } catch (err: any) {
            console.error("Error loading schedules:", err);
            setError(err?.message || "Không thể tải dữ liệu lịch làm việc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, [currentMonth]);

    const handlePrevMonth = () => {
        setCurrentMonth(currentMonth.subtract(1, "month"));
    };

    const handleNextMonth = () => {
        setCurrentMonth(currentMonth.add(1, "month"));
    };

    const handleToday = () => {
        setCurrentMonth(dayjs());
    };

    const handleDateClick = (day: CalendarDay) => {
        if (day.schedules.length > 0) {
            setSelectedDate(day.date);
            setModalVisible(true);
        }
    };

    const selectedDaySchedules = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.format("YYYY-MM-DD");
        return schedules.filter(
            (schedule) => dayjs(schedule.date).format("YYYY-MM-DD") === dateStr
        );
    }, [selectedDate, schedules]);

    return (
        <div style={{ padding: isMobile ? "12px" : "24px", maxWidth: "1400px", margin: "0 auto" }}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {/* Header */}
                <Card>
                    <Space
                        direction={isMobile ? "vertical" : "horizontal"}
                        style={{ width: "100%", justifyContent: "space-between" }}
                        wrap
                    >
                        <Title level={3} style={{ margin: 0 }}>
                            Lịch làm việc của tôi
                        </Title>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate("/my-workschedule/create")}
                            >
                                {isMobile ? "Tạo mới" : "Tạo lịch làm việc"}
                            </Button>
                        </Space>
                    </Space>
                </Card>

                {/* Calendar Navigation */}
                <Card>
                    <Space
                        direction={isMobile ? "vertical" : "horizontal"}
                        style={{ width: "100%", justifyContent: "space-between" }}
                        wrap
                    >
                        <Space>
                            <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
                            <Button onClick={handleToday}>Hôm nay</Button>
                            <Button icon={<RightOutlined />} onClick={handleNextMonth} />
                        </Space>
                        <Title level={4} style={{ margin: 0 }}>
                            {currentMonth.format("MMMM YYYY")}
                        </Title>
                        <Space>
                            <Tag color="orange">Chờ duyệt</Tag>
                            <Tag color="green">Đã duyệt</Tag>
                            <Tag color="red">Từ chối</Tag>
                        </Space>
                    </Space>
                </Card>

                {error && (
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error}
                        showIcon
                    />
                )}

                {/* Calendar Grid */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <div className="workschedule-calendar">
                        {/* Week Days Header */}
                        <Row gutter={[8, 8]} className="calendar-header">
                            {weekDays.map((day, index) => (
                                <Col span={24 / 7} key={index}>
                                    <div className="calendar-header-cell">{day}</div>
                                </Col>
                            ))}
                        </Row>

                        {/* Calendar Days */}
                        <Row
                            gutter={isMobile ? [4, 4] : [8, 8]}
                            className="calendar-body"
                        >
                            {calendarDays.map((day, index) => {
                                const hasSchedules = day.schedules.length > 0;
                                const approvedCount = day.schedules.filter(
                                    (s) => s.status === "APPROVED"
                                ).length;
                                const pendingCount = day.schedules.filter(
                                    (s) => s.status === "PENDING"
                                ).length;
                                const rejectedCount = day.schedules.filter(
                                    (s) => s.status === "REJECTED"
                                ).length;

                                return (
                                    <Col span={24 / 7} key={index}>
                                        <div
                                            className={`calendar-day ${
                                                !day.isCurrentMonth ? "other-month" : ""
                                            } ${day.isToday ? "today" : ""} ${
                                                hasSchedules ? "has-schedules" : ""
                                            }`}
                                            onClick={() => handleDateClick(day)}
                                            style={{ cursor: hasSchedules ? "pointer" : "default" }}
                                        >
                                            <div className="day-number">{day.date.format("D")}</div>
                                            {hasSchedules && (
                                                <div className="day-schedules">
                                                    {approvedCount > 0 && (
                                                        <Badge
                                                            count={approvedCount}
                                                            style={{ backgroundColor: "#52c41a" }}
                                                        />
                                                    )}
                                                    {pendingCount > 0 && (
                                                        <Badge
                                                            count={pendingCount}
                                                            style={{ backgroundColor: "#faad14" }}
                                                        />
                                                    )}
                                                    {rejectedCount > 0 && (
                                                        <Badge
                                                            count={rejectedCount}
                                                            style={{ backgroundColor: "#ff4d4f" }}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </div>
                )}

                {/* Schedule Details Modal */}
                <Modal
                    title={`Lịch làm việc ngày ${selectedDate?.format("DD/MM/YYYY")}`}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setModalVisible(false)}>
                            Đóng
                        </Button>,
                    ]}
                    width={isMobile ? "90%" : 600}
                >
                    <Space direction="vertical" style={{ width: "100%" }} size="middle">
                        {selectedDaySchedules.length === 0 ? (
                            <Text type="secondary">Không có lịch làm việc nào</Text>
                        ) : (
                            selectedDaySchedules.map((schedule) => (
                                <Card key={schedule.id} size="small">
                                    <Space direction="vertical" style={{ width: "100%" }} size="small">
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text strong>
                                                {schedule.shift?.name || "N/A"}
                                            </Text>
                                        </Space>
                                        {schedule.shift && (
                                            <Text type="secondary">
                                                {dayjs(schedule.shift.startTime).format("HH:mm")} -{" "}
                                                {dayjs(schedule.shift.endTime).format("HH:mm")}
                                            </Text>
                                        )}
                                        <Tag color={STATUS_COLORS[schedule.status]}>
                                            {STATUS_LABELS[schedule.status]}
                                        </Tag>
                                        {schedule.note && (
                                            <Text type="secondary" style={{ display: "block" }}>
                                                Ghi chú: {schedule.note}
                                            </Text>
                                        )}
                                    </Space>
                                </Card>
                            ))
                        )}
                    </Space>
                </Modal>
            </Space>
        </div>
    );
};

export default MyWorkSchedulePage;

