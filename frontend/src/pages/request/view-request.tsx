import { Button, Card, Typography, Space, Spin, Alert, Descriptions, Tag, Modal, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { getRequestByIdAPI, approveRequestAPI } from "@/services/api";
import type { Request, RequestStatus, ApproveRequestPayload } from "@/types/request";
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useCurrentApp } from "@/components/context/app.context";
import { handleApiSuccess, notifyError } from "@/utils/notification";

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusTag = (status: RequestStatus) => {
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

const ViewRequestPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useCurrentApp();
    const navigate = useNavigate();
    const [request, setRequest] = useState<Request | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveStatus, setApproveStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm();

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const canAction = isAdmin || isHR;

    useEffect(() => {
        const fetchData = async () => {
            if (!id) {
                setError("Không tìm thấy ID đơn");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const res = await getRequestByIdAPI(id);
                let requestData: Request | null = null;

                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        requestData = res.data as Request;
                    } else if ("id" in res && "employeeId" in res && !("data" in res)) {
                        requestData = res as unknown as Request;
                    }
                }

                if (requestData) {
                    setRequest(requestData);
                } else {
                    const errorMsg = (res as any)?.message || "Không tìm thấy thông tin đơn";
                    setError(errorMsg);
                }
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Không thể tải thông tin đơn";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const openApproveModal = (status: "APPROVED" | "REJECTED") => {
        if (!canAction) return;
        setApproveStatus(status);
        form.resetFields();
        setApproveModalOpen(true);
    };

    const handleApprove = async () => {
        if (!request) return;
        setIsSubmitting(true);
        try {
            const payload: ApproveRequestPayload = {
                status: approveStatus,
                note: form.getFieldValue("note")?.trim() || undefined,
            };
            const res = await approveRequestAPI(request.id, payload);
            const successMsg = approveStatus === "APPROVED" ? "Duyệt đơn thành công!" : "Từ chối đơn thành công!";
            if (handleApiSuccess(res, successMsg, "Có lỗi xảy ra khi cập nhật trạng thái")) {
                setApproveModalOpen(false);
                form.resetFields();
                // Reload data
                const res = await getRequestByIdAPI(request.id);
                if (res && typeof res === "object") {
                    if ("data" in res && res.data) {
                        setRequest(res.data as Request);
                    } else if ("id" in res && "employeeId" in res && !("data" in res)) {
                        setRequest(res as unknown as Request);
                    }
                }
            }
        } catch (err: any) {
            notifyError(err, "Có lỗi xảy ra khi cập nhật trạng thái");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Text>Đang tải thông tin đơn...</Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
                <Card>
                    <Alert
                        type="error"
                        message="Lỗi"
                        description={error || "Không tìm thấy thông tin đơn"}
                        action={
                            <Button size="small" onClick={() => navigate("/request")}>
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
                            Chi tiết đơn
                        </Title>
                        <Space>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/request")}>
                                Quay lại
                            </Button>
                            {canAction && request.status === "PENDING" && (
                                <>
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={() => navigate(`/request/${id}/edit`)}
                                        style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
                                    >
                                        Chỉnh sửa
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        onClick={() => openApproveModal("APPROVED")}
                                    >
                                        Duyệt đơn
                                    </Button>
                                    <Button
                                        danger
                                        icon={<CloseOutlined />}
                                        onClick={() => openApproveModal("REJECTED")}
                                    >
                                        Từ chối
                                    </Button>
                                </>
                            )}
                            {!canAction && request.status === "PENDING" && (
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => navigate(`/request/${id}/edit`)}
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
                            {request.employee?.fullName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mã nhân viên">
                            {request.employee?.employeeCode || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {request.employee?.email || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phòng ban">
                            {request.employee?.department?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chức vụ">
                            {request.employee?.position?.title || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại đơn">
                            {request.requestType?.name || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Mô tả loại đơn">
                            {request.requestType?.description || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lý do">
                            {request.reason || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày bắt đầu">
                            {request.startDate
                                ? dayjs(request.startDate).format("DD/MM/YYYY")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày kết thúc">
                            {request.endDate
                                ? dayjs(request.endDate).format("DD/MM/YYYY")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {statusTag(request.status)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người duyệt">
                            {request.approvedBy?.fullName || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày duyệt">
                            {request.approvedDate
                                ? dayjs(request.approvedDate).format("DD/MM/YYYY HH:mm:ss")
                                : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email người duyệt">
                            {request.approvedBy?.email || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">
                            {dayjs(request.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cập nhật">
                            {dayjs(request.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
                        </Descriptions.Item>
                    </Descriptions>
                </Space>
            </Card>

            <Modal
                title={approveStatus === "APPROVED" ? "Duyệt đơn" : "Từ chối đơn"}
                open={approveModalOpen}
                onOk={handleApprove}
                onCancel={() => {
                    setApproveModalOpen(false);
                    form.resetFields();
                }}
                okText={approveStatus === "APPROVED" ? "Duyệt" : "Từ chối"}
                cancelText="Hủy"
                okButtonProps={{ danger: approveStatus === "REJECTED", loading: isSubmitting }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Ghi chú" name="note">
                        <TextArea rows={4} placeholder="Nhập ghi chú (tùy chọn)" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ViewRequestPage;

