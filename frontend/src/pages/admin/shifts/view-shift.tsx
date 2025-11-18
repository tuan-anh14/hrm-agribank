import { Button, Card, Typography, Space, Spin, Alert, Descriptions } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getShiftByIdAPI } from "@/services/api";
import type { Shift } from "@/types/shift";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ViewShiftPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [shift, setShift] = useState<Shift | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShift = async () => {
            if (!id) {
                setError("Không tìm thấy ID ca làm việc");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getShiftByIdAPI(id);
                let shiftData: Shift | null = null;

                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        shiftData = res.data as Shift;
                    } else if ("id" in res && "name" in res && !("data" in res)) {
                        shiftData = res as unknown as Shift;
                    }
                }

                if (shiftData) {
                    setShift(shiftData);
                } else {
                    const errorMsg =
                        (res as any)?.message || "Không tìm thấy thông tin ca làm việc";
                    setError(errorMsg);
                }
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Không thể tải thông tin ca làm việc";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchShift();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin ca làm việc...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !shift) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin ca làm việc"}
                        action={
                            <Button size="small" onClick={() => navigate("/shift")}>
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
                            Chi tiết ca làm việc
                        </Title>
                        <Space>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/shift")}>
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                icon={<EditOutlined />}
                                onClick={() => navigate(`/shift/${id}/edit`)}
                                style={{ backgroundColor: "#faad14", borderColor: "#faad14" }}
                            >
                                Chỉnh sửa
                            </Button>
                        </Space>
                    </Space>

                    <Descriptions bordered column={1} size="middle">
                        <Descriptions.Item label="Tên ca">{shift.name}</Descriptions.Item>
                        <Descriptions.Item label="Giờ bắt đầu">
                            {dayjs(shift.startTime).format("HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giờ kết thúc">
                            {dayjs(shift.endTime).format("HH:mm")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thời lượng">
                            {(() => {
                                const start = dayjs(shift.startTime);
                                const end = dayjs(shift.endTime);
                                const duration = end.diff(start, "minute");
                                if (duration <= 0) return "Không hợp lệ";
                                const hours = Math.floor(duration / 60);
                                const minutes = duration % 60;
                                return `${hours ? `${hours} giờ` : ""} ${minutes ? `${minutes} phút` : ""}`.trim();
                            })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(shift.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {dayjs(shift.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewShiftPage;