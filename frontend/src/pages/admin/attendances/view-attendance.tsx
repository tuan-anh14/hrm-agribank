import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getAttendanceByIdAPI } from "@/services/api";
import type { Attendance } from "@/types/attendance";
import { useCurrentApp } from "@/components/context/app.context";

const { Title, Text } = Typography;

const getStatusColor = (status: string) => {
    switch (status) {
        case 'ON_TIME':
            return 'green';
        case 'LATE':
            return 'orange';
        case 'ABSENT':
            return 'red';
        default:
            return 'default';
    }
};

const getStatusText = (status: string) => {
    switch (status) {
        case 'ON_TIME':
            return 'Đúng giờ';
        case 'LATE':
            return 'Muộn';
        case 'ABSENT':
            return 'Vắng mặt';
        default:
            return status;
    }
};

const ViewAttendancePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useCurrentApp();
    const isEmployee = user?.role === 'EMPLOYEE';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!id) {
                setError("Không tìm thấy ID chấm công");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getAttendanceByIdAPI(id);
                // Axios interceptor unwraps response.data
                let attendanceData: Attendance | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        attendanceData = res.data as Attendance;
                    } else if ('id' in res && 'employeeId' in res && !('data' in res)) {
                        attendanceData = res as unknown as Attendance;
                    }
                }
                
                if (attendanceData) {
                    setAttendance(attendanceData);
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin chấm công";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching attendance:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin chấm công";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin chấm công...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !attendance) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin chấm công"}
                        action={
                            <Button size="small" onClick={() => navigate("/attendance")}>
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
                            Chi tiết chấm công
                        </Title>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/attendance")}
                            >
                                Quay lại
                            </Button>
                            {!isEmployee && (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/attendance/${id}/edit`)}
                                    style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                                >
                                    Chỉnh sửa
                                </Button>
                            )}
                        </Space>
                    </Space>

                    <Descriptions
                        bordered
                        column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                        size="middle"
                    >
                        <Descriptions.Item label="Nhân viên">
                            {attendance.employee?.fullName || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {attendance.employee?.email || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">
                            {attendance.employee?.department?.name || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chức vụ">
                            {attendance.employee?.position?.title || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày chấm công">
                            {dayjs(attendance.date).format('DD/MM/YYYY')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={getStatusColor(attendance.status)}>
                                {getStatusText(attendance.status)}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Giờ check-in">
                            {attendance.checkInTime 
                                ? dayjs(attendance.checkInTime).format('DD/MM/YYYY HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giờ check-out">
                            {attendance.checkOutTime 
                                ? dayjs(attendance.checkOutTime).format('DD/MM/YYYY HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú" span={2}>
                            {attendance.note || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(attendance.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {attendance.updatedAt
                                ? dayjs(attendance.updatedAt).format('DD/MM/YYYY HH:mm:ss')
                                : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewAttendancePage;

