import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getRequestTypeByIdAPI } from "@/services/api";
import type { RequestType } from "@/types/request";

const { Title, Text } = Typography;

const ViewRequestTypePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestType, setRequestType] = useState<RequestType | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequestType = async () => {
            if (!id) {
                setError("Không tìm thấy ID loại đơn");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getRequestTypeByIdAPI(id);
                let requestTypeData: RequestType | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        requestTypeData = res.data as RequestType;
                    } else if ('id' in res && 'name' in res && !('data' in res)) {
                        requestTypeData = res as unknown as RequestType;
                    }
                }
                
                if (requestTypeData) {
                    setRequestType(requestTypeData);
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin loại đơn";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching request type:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin loại đơn";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchRequestType();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin loại đơn...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !requestType) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin loại đơn"}
                        action={
                            <Button size="small" onClick={() => navigate("/request-type")}>
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
                            Chi tiết loại đơn
                        </Title>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/request-type")}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/request-type/${id}/edit`)}
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
                        <Descriptions.Item label="Tên loại đơn">{requestType.name}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{requestType.description || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Số đơn">
                            <Tag color="blue">{requestType._count?.requests || 0}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {new Date(requestType.createdAt).toLocaleDateString("vi-VN")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {requestType.updatedAt
                                ? new Date(requestType.updatedAt).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewRequestTypePage;

