import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag } from "antd";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { getEmployeeByIdAPI } from "@/services/api";
import type { Employee } from "@/types/employee";

const { Title, Text } = Typography;

const ViewEmployeePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!id) {
                setError("Không tìm thấy ID nhân viên");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getEmployeeByIdAPI(id);
                if (res?.data) {
                    setEmployee(res.data);
                } else {
                    setError("Không tìm thấy thông tin nhân viên");
                }
            } catch (error: any) {
                console.error("Error fetching employee:", error);
                setError(error?.response?.data?.message || "Không thể tải thông tin nhân viên");
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin nhân viên...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin nhân viên"}
                        action={
                            <Button size="small" onClick={() => navigate("/admin/employees")}>
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
                            Chi tiết nhân viên
                        </Title>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate("/admin/employees")}
                            >
                                Quay lại
                            </Button>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => navigate(`/admin/employees/${id}/edit`)}
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
                        <Descriptions.Item label="Họ và tên">{employee.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Email">{employee.email || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{employee.phone || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{employee.gender || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                            {employee.dateOfBirth
                                ? new Date(employee.dateOfBirth).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{employee.address || "-"}</Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">
                            {employee.department?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chức vụ">
                            {employee.position?.title || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={String(employee.status).toLowerCase() === "working" ? "green" : "default"}>
                                {employee.status || "-"}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu làm việc">
                            {employee.startDate
                                ? new Date(employee.startDate).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {new Date(employee.createdAt).toLocaleDateString("vi-VN")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {employee.updatedAt
                                ? new Date(employee.updatedAt).toLocaleDateString("vi-VN")
                                : "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>
        </div>
    );
};

export default ViewEmployeePage;

