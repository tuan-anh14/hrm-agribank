import React, { useState, useEffect, useMemo } from "react";
import { Card, Typography, Space, Button, Spin, Alert, message, Tag, Row, Col, Modal, Badge } from "antd";
import { LeftOutlined, RightOutlined, ClockCircleOutlined, TableOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getMyAttendancesAPI, checkInAPI, checkOutAPI } from "@/services/api";
import type { Attendance } from "@/types/attendance";
import { useCurrentApp } from "@/components/context/app.context";
import { useIsMobile } from "@/hooks/useResponsive";
import "./attendance.scss";

const { Title, Text } = Typography;

interface CalendarDay {
    date: Dayjs;
    attendance?: Attendance;
    isCurrentMonth: boolean;
    isToday: boolean;
}

const getStatusInfo = (attendance: Attendance | undefined) => {
    if (!attendance) return null;

    const checkIn = attendance.checkInTime ? dayjs(attendance.checkInTime) : null;
    const checkOut = attendance.checkOutTime ? dayjs(attendance.checkOutTime) : null;
    
    let statusText = "";
    let statusColor = "";
    let hours = 0;

    if (attendance.status === "ABSENT") {
        return { text: "Nghỉ", color: "red", hours: 0 };
    }

    if (checkIn && checkOut) {
        hours = checkOut.diff(checkIn, "hour", true);
        
        // Kiểm tra đi muộn (sau 9:00)
        const lateCheckIn = checkIn.hour() > 9 || (checkIn.hour() === 9 && checkIn.minute() > 0);
        
        // Kiểm tra về sớm (trước 17:00)
        const earlyCheckOut = checkOut.hour() < 17 || (checkOut.hour() === 17 && checkOut.minute() < 30);
        
        // Kiểm tra tăng ca (sau 17:30)
        const overtime = checkOut.hour() > 17 || (checkOut.hour() === 17 && checkOut.minute() >= 30);

        if (lateCheckIn && earlyCheckOut) {
            statusText = "Đi muộn - Về sớm";
            statusColor = "orange";
        } else if (lateCheckIn) {
            statusText = "Đi muộn";
            statusColor = "orange";
        } else if (earlyCheckOut) {
            statusText = "Về sớm";
            statusColor = "orange";
        } else if (overtime) {
            statusText = "Tăng ca - Làm thêm";
            statusColor = "blue";
        } else if (checkIn.hour() < 8 || (checkIn.hour() === 8 && checkIn.minute() < 15)) {
            statusText = "Vào ca sớm";
            statusColor = "green";
        } else {
            statusText = "Đúng giờ";
            statusColor = "green";
        }
    } else if (checkIn) {
        if (checkIn.hour() < 8 || (checkIn.hour() === 8 && checkIn.minute() < 15)) {
            statusText = "Vào ca sớm";
            statusColor = "green";
        } else if (checkIn.hour() > 9 || (checkIn.hour() === 9 && checkIn.minute() > 0)) {
            statusText = "Đi muộn";
            statusColor = "orange";
        } else {
            statusText = "Đúng giờ";
            statusColor = "green";
        }
    }

    return { text: statusText, color: statusColor, hours };
};

const AttendancePage: React.FC = () => {
    const { user } = useCurrentApp();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const isEmployee = user?.role === 'EMPLOYEE';
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Lấy thông tin chấm công hôm nay
    const todayAttendance = useMemo(() => {
        const today = dayjs().format("YYYY-MM-DD");
        return attendances.find(
            (att) => dayjs(att.date).format("YYYY-MM-DD") === today
        );
    }, [attendances]);

    // Tạo calendar grid
    const calendarDays = useMemo(() => {
        const startOfMonth = currentMonth.startOf("month");
        const endOfMonth = currentMonth.endOf("month");
        const startDate = startOfMonth.startOf("week"); // Bắt đầu từ Chủ nhật
        const endDate = endOfMonth.endOf("week"); // Kết thúc ở Thứ bảy

        const days: CalendarDay[] = [];
        let currentDate = startDate;

        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
            const dateStr = currentDate.format("YYYY-MM-DD");
            const attendance = attendances.find(
                (att) => dayjs(att.date).format("YYYY-MM-DD") === dateStr
            );

            days.push({
                date: currentDate,
                attendance,
                isCurrentMonth: currentDate.month() === currentMonth.month(),
                isToday: currentDate.isSame(dayjs(), "day"),
            });

            currentDate = currentDate.add(1, "day");
        }

        return days;
    }, [currentMonth, attendances]);

    // Load attendances
    const loadAttendances = async () => {
        setLoading(true);
        setError(null);

        try {
            const startDate = currentMonth.startOf("month").format("YYYY-MM-DD");
            const endDate = currentMonth.endOf("month").format("YYYY-MM-DD");

            const res = await getMyAttendancesAPI({
                startDate,
                endDate,
                page: 1,
                limit: 100,
            });

            if (res && typeof res === "object" && "data" in res) {
                setAttendances(res.data || []);
            } else {
                setAttendances(Array.isArray(res) ? res : []);
            }
        } catch (err: any) {
            console.error("Error loading attendances:", err);
            setError(err?.message || "Không thể tải dữ liệu chấm công");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendances();
    }, [currentMonth]);

    // Check-in
    const handleCheckIn = async () => {
        if (todayAttendance?.checkInTime) {
            message.warning("Bạn đã check-in hôm nay rồi!");
            return;
        }

        setCheckingIn(true);
        try {
            const res = await checkInAPI({});
            if (res?.data || res?.message) {
                message.success("Check-in thành công!");
                await loadAttendances();
            } else {
                message.error("Có lỗi xảy ra khi check-in");
            }
        } catch (err: any) {
            const errorMsg =
                err?.response?.data?.message || "Có lỗi xảy ra khi check-in";
            message.error(errorMsg);
        } finally {
            setCheckingIn(false);
        }
    };

    // Check-out
    const handleCheckOut = async () => {
        if (!todayAttendance?.checkInTime) {
            message.warning("Vui lòng check-in trước khi check-out!");
            return;
        }

        if (todayAttendance?.checkOutTime) {
            message.warning("Bạn đã check-out hôm nay rồi!");
            return;
        }

        setCheckingOut(true);
        try {
            const res = await checkOutAPI({});
            if (res?.data || res?.message) {
                message.success("Check-out thành công!");
                await loadAttendances();
            } else {
                message.error("Có lỗi xảy ra khi check-out");
            }
        } catch (err: any) {
            const errorMsg =
                err?.response?.data?.message || "Có lỗi xảy ra khi check-out";
            message.error(errorMsg);
        } finally {
            setCheckingOut(false);
        }
    };

    const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

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
        if (day.attendance) {
            setSelectedDate(day.date);
            setModalVisible(true);
        }
    };

    const selectedDayAttendance = useMemo(() => {
        if (!selectedDate) return null;
        const dateStr = selectedDate.format("YYYY-MM-DD");
        return attendances.find(
            (att) => dayjs(att.date).format("YYYY-MM-DD") === dateStr
        );
    }, [selectedDate, attendances]);

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
                            Chấm công
                        </Title>
                        <Space wrap>
                            {!isEmployee && (
                                <Button
                                    icon={<TableOutlined />}
                                    onClick={() => navigate("/attendance/manage")}
                                >
                                    {isMobile ? "Quản lý" : "Quản lý chấm công"}
                                </Button>
                            )}
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
                            <Tag color="green">Đúng giờ</Tag>
                            <Tag color="orange">Đi muộn/Về sớm</Tag>
                            <Tag color="blue">Tăng ca</Tag>
                            <Tag color="red">Nghỉ</Tag>
                        </Space>
                    </Space>
                </Card>

                {/* Check-in/Check-out Buttons */}
                <Card
                    className="check-in-out-card"
                >
                        <Space
                            direction="vertical"
                            size={isMobile ? 12 : 16}
                            style={{ width: "100%", textAlign: "center" }}
                        >
                            <Text className="today-text" style={{ fontSize: isMobile ? 14 : 16 }}>
                                Hôm nay: {dayjs().format("DD/MM/YYYY")}
                            </Text>
                            <Space 
                                direction={isMobile ? "vertical" : "horizontal"}
                                size={isMobile ? 12 : 16}
                                style={{ width: "100%" }}
                            >
                                <Button
                                    type="primary"
                                    size={isMobile ? "middle" : "large"}
                                    icon={<ClockCircleOutlined />}
                                    onClick={handleCheckIn}
                                    loading={checkingIn}
                                    disabled={!!todayAttendance?.checkInTime}
                                    className="check-in-btn"
                                    block={isMobile}
                                >
                                    VÀO CA
                                </Button>
                                <Button
                                    type="primary"
                                    size={isMobile ? "middle" : "large"}
                                    icon={<ClockCircleOutlined />}
                                    onClick={handleCheckOut}
                                    loading={checkingOut}
                                    disabled={
                                        !todayAttendance?.checkInTime ||
                                        !!todayAttendance?.checkOutTime
                                    }
                                    className="check-out-btn"
                                    block={isMobile}
                                >
                                    KẾT CA
                                </Button>
                            </Space>
                            {todayAttendance && (
                                <Space 
                                    direction={isMobile ? "vertical" : "horizontal"}
                                    size={8}
                                    wrap
                                >
                                    {todayAttendance.checkInTime && (
                                        <Tag color="green" style={{ fontSize: isMobile ? 12 : 14 }}>
                                            Vào: {dayjs(todayAttendance.checkInTime).format("HH:mm:ss")}
                                        </Tag>
                                    )}
                                    {todayAttendance.checkOutTime && (
                                        <Tag color="blue" style={{ fontSize: isMobile ? 12 : 14 }}>
                                            Ra: {dayjs(todayAttendance.checkOutTime).format("HH:mm:ss")}
                                        </Tag>
                                    )}
                                </Space>
                            )}
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
                    <div className="attendance-calendar">
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
                                const statusInfo = getStatusInfo(day.attendance);
                                const hasAttendance = !!day.attendance;
                                const isAbsent = day.attendance?.status === "ABSENT";

                                return (
                                    <Col span={24 / 7} key={index}>
                                        <div
                                            className={`calendar-day ${
                                                !day.isCurrentMonth ? "other-month" : ""
                                            } ${day.isToday ? "today" : ""} ${
                                                hasAttendance ? "has-attendance" : ""
                                            } ${isAbsent ? "absent" : ""}`}
                                            onClick={() => handleDateClick(day)}
                                            style={{ cursor: hasAttendance ? "pointer" : "default" }}
                                        >
                                            <div className="day-number">{day.date.format("D")}</div>
                                            {hasAttendance && day.attendance && (
                                                <div className="day-attendance">
                                                    {day.attendance.checkInTime && (
                                                        <div className="time-info">
                                                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                                                            <span>
                                                                {dayjs(day.attendance.checkInTime).format("HH:mm")}
                                                                {day.attendance.checkOutTime
                                                                    ? ` - ${dayjs(day.attendance.checkOutTime).format("HH:mm")}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {statusInfo && (
                                                        <Badge
                                                            color={statusInfo.color}
                                                            text={isMobile ? statusInfo.text.split(" ")[0] : statusInfo.text}
                                                            style={{ fontSize: isMobile ? 9 : 11 }}
                                                        />
                                                    )}
                                                    {isAbsent && (
                                                        <Badge
                                                            color="red"
                                                            text="Nghỉ"
                                                            style={{ fontSize: isMobile ? 9 : 11 }}
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

                {/* Attendance Details Modal */}
                <Modal
                    title={`Chi tiết chấm công ngày ${selectedDate?.format("DD/MM/YYYY")}`}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={[
                        <Button key="close" onClick={() => setModalVisible(false)}>
                            Đóng
                        </Button>,
                    ]}
                    width={isMobile ? "90%" : 600}
                >
                    {selectedDayAttendance ? (
                        <Space direction="vertical" style={{ width: "100%" }} size="middle">
                            <Card size="small">
                                <Space direction="vertical" style={{ width: "100%" }} size="small">
                                    {selectedDayAttendance.checkInTime && (
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text strong>Giờ vào ca:</Text>
                                            <Text>
                                                {dayjs(selectedDayAttendance.checkInTime).format("HH:mm:ss")}
                                            </Text>
                                        </Space>
                                    )}
                                    {selectedDayAttendance.checkOutTime && (
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text strong>Giờ kết ca:</Text>
                                            <Text>
                                                {dayjs(selectedDayAttendance.checkOutTime).format("HH:mm:ss")}
                                            </Text>
                                        </Space>
                                    )}
                                    {selectedDayAttendance.checkInTime && selectedDayAttendance.checkOutTime && (
                                        <Space>
                                            <Text strong>Tổng giờ làm:</Text>
                                            <Text>
                                                {dayjs(selectedDayAttendance.checkOutTime)
                                                    .diff(dayjs(selectedDayAttendance.checkInTime), "hour", true)
                                                    .toFixed(2)}{" "}
                                                giờ
                                            </Text>
                                        </Space>
                                    )}
                                    {(() => {
                                        const statusInfo = getStatusInfo(selectedDayAttendance);
                                        return statusInfo ? (
                                            <Space>
                                                <Text strong>Trạng thái:</Text>
                                                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                                            </Space>
                                        ) : null;
                                    })()}
                                    {selectedDayAttendance.note && (
                                        <Space direction="vertical" style={{ width: "100%" }}>
                                            <Text strong>Ghi chú:</Text>
                                            <Text type="secondary">{selectedDayAttendance.note}</Text>
                                        </Space>
                                    )}
                                </Space>
                            </Card>
                        </Space>
                    ) : (
                        <Text type="secondary">Không có thông tin chấm công</Text>
                    )}
                </Modal>
            </Space>
        </div>
    );
};

export default AttendancePage;
