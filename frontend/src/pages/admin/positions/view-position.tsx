import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getPositionByIdAPI } from "@/services/api";
import type { Position } from "@/types/position";

const { Title, Text } = Typography;

const ViewPositionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [position, setPosition] = useState<Position | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPosition = async () => {
            if (!id) {
                setError("Không tìm thấy ID chức vụ");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getPositionByIdAPI(id);
                // Axios interceptor unwraps response.data
                let positionData: Position | null = null;

                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        positionData = res.data as Position;
                    } else if ('id' in res && 'title' in res && !('data' in res)) {
                        positionData = res as unknown as Position;
                    }
                }

                if (positionData) {
                    setPosition(positionData);
                } else {
                    const errorMsg = (res as any)?.message
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin chức vụ";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching position:", error);
                const errorMessage = error?.response?.data?.message
                    || error?.message
                    || "Không thể tải thông tin chức vụ";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchPosition();
    }, [id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin chức vụ...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !position) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin chức vụ"}
                        action={
                            <Button size="small" onClick={() => navigate("/position")}>
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
                            Chi tiết chức vụ
                        </Title>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/position")}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/position/${id}/edit`)}
                                style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
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
                        <Descriptions.Item label="Tên chức vụ">{position.title}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">
                            {position.description || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lương cơ bản">
                            {formatCurrency(position.baseSalary)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phụ cấp">
                            {position.allowance ? formatCurrency(position.allowance) : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cấp bậc">
                            {position.gradeLevel ? <Tag color="purple">Cấp {position.gradeLevel}</Tag> : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số nhân viên">
                            <Tag color="blue">{position._count?.employees || 0}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {new Date(position.createdAt).toLocaleDateString("vi-VN")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {position.updatedAt
                                ? new Date(position.updatedAt).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewPositionPage;

