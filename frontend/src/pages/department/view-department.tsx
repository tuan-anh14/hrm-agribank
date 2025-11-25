import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getDepartmentByIdAPI } from "@/services/api";
import type { Department } from "@/types/department";

const { Title, Text } = Typography;

const ViewDepartmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDepartment = async () => {
            if (!id) {
                setError("Không tìm thấy ID phòng ban");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getDepartmentByIdAPI(id);
                // Axios interceptor unwraps response.data
                let departmentData: Department | null = null;
                
                if (res && typeof res === 'object') {
                    if ('data' in res && res.data) {
                        departmentData = res.data as Department;
                    } else if ('id' in res && 'name' in res && !('data' in res)) {
                        departmentData = res as unknown as Department;
                    }
                }
                
                if (departmentData) {
                    setDepartment(departmentData);
                } else {
                    const errorMsg = (res as any)?.message 
                        ? (Array.isArray((res as any).message) ? (res as any).message[0] : (res as any).message)
                        : "Không tìm thấy thông tin phòng ban";
                    setError(errorMsg);
                }
            } catch (error: any) {
                console.error("Error fetching department:", error);
                const errorMessage = error?.response?.data?.message 
                    || error?.message 
                    || "Không thể tải thông tin phòng ban";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartment();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin phòng ban...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !department) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin phòng ban"}
                        action={
                            <Button size="small" onClick={() => navigate("/department")}>
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
                            Chi tiết phòng ban
                        </Title>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/department")}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/department/${id}/edit`)}
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
                        <Descriptions.Item label="Tên phòng ban">{department.name}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả">{department.description || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Số nhân viên">
                            <Tag color="blue">{department._count?.employees || 0}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {new Date(department.createdAt).toLocaleDateString("vi-VN")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {department.updatedAt
                                ? new Date(department.updatedAt).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewDepartmentPage;

