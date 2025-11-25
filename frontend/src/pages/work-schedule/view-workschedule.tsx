import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getWorkScheduleByIdAPI } from "@/services/api";
import type { WorkSchedule, WorkScheduleStatus } from "@/types/workschedule";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const statusTag = (status: WorkScheduleStatus) => {
    switch (status) {
        case "PENDING":
            return <Tag>Chờ duyệt</Tag>;
        case "APPROVED":
            return <Tag color="green">Đã duyệt</Tag>;
        case "REJECTED":
            return <Tag color="red">Từ chối</Tag>;
        default:
            return status;
    }
};

const ViewWorkSchedulePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [schedule, setSchedule] = useState<WorkSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID lịch làm việc");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getWorkScheduleByIdAPI(id);
                let scheduleData: WorkSchedule | null = null;

                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        scheduleData = res.data as WorkSchedule;
                    } else if ("id" in res && "employeeId" in res && !("data" in res)) {
                        scheduleData = res as unknown as WorkSchedule;
                    }
                }

                if (scheduleData) {
                    setSchedule(scheduleData);
                } else {
                    const errorMsg = (res as any)?.message || "Không tìm thấy thông tin lịch làm việc";
                    setError(errorMsg);
                }
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Không thể tải thông tin lịch làm việc";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin lịch làm việc...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !schedule) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin lịch làm việc"}
                        action={
                            <Button size="small" onClick={() => navigate("/workschedule")}>
                                Quay lại
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Space style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <Title level={2} style={{ margin: 0 }}>
                            Chi tiết lịch làm việc
                        </Title>
                        <Space>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/workschedule")}>
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/workschedule/${id}/edit`)}
                                style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                                disabled={schedule.status !== "PENDING"}
                            >
                                Chỉnh sửa
                            </Button>
                        </Space>
                    </Space>

                    <Descriptions
                        bordered
                        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                        size="middle"
                    >
                        <Descriptions.Item label="Nhân viên">
                            {schedule.employee?.fullName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {schedule.employee?.email || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ca làm việc">
                            {schedule.shift?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời gian ca">
                            {schedule.shift
                                ? `${dayjs(schedule.shift.startTime).format("HH:mm")} - ${dayjs(schedule.shift.endTime).format("HH:mm")}`
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày làm việc">
                            {dayjs(schedule.date).format("DD/MM/YYYY")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {statusTag(schedule.status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">
                            {schedule.note || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người duyệt">
                            {schedule.approvedBy?.fullName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày duyệt">
                            {schedule.approvedDate
                                ? dayjs(schedule.approvedDate).format("DD/MM/YYYY HH:mm:ss")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(schedule.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {dayjs(schedule.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewWorkSchedulePage;

