import { Button, Form, Select, DatePicker, Input, Card, Typography, Space, Spin, Alert } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getRequestByIdAPI, updateRequestAPI, getAllRequestTypesAPI } from "@/services/api";
import type { Request, RequestType, UpdateRequestPayload } from "@/types/request";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import { useCurrentApp } from "@/components/context/app.context";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    requestTypeId: string;
    reason?: string;
    startDate?: dayjs.Dayjs;
    endDate?: dayjs.Dayjs;
};

const UpdateRequestPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useCurrentApp();
    const [form] = Form.useForm<FieldType>();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [request, setRequest] = useState<Request | null>(null);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;

    useEffect(() => {
        const loadRequestTypes = async () => {
            try {
                const res = await getAllRequestTypesAPI();
                const list: RequestType[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setRequestTypes(list);
            } catch (error) {
                console.error("Error loading request types", error);
            }
        };

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

                    // Check permissions
                    if (isEmployee && requestData.employeeId !== user?.id) {
                        setError("Bạn không có quyền chỉnh sửa đơn này");
                        setLoading(false);
                        return;
                    }

                    if (requestData.status !== "PENDING") {
                        setError("Chỉ có thể chỉnh sửa đơn ở trạng thái chờ duyệt");
                        setLoading(false);
                        return;
                    }

                    form.setFieldsValue({
                        requestTypeId: requestData.requestTypeId,
                        reason: requestData.reason || undefined,
                        startDate: requestData.startDate ? dayjs(requestData.startDate) : undefined,
                        endDate: requestData.endDate ? dayjs(requestData.endDate) : undefined,
                    });
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

        loadRequestTypes();
        fetchData();
    }, [id, form, isEmployee, user?.id]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!id) {
            notifyError(new Error("Không tìm thấy ID đơn"), "Không tìm thấy ID đơn");
            return;
        }

        // Validate date range
        if (values.startDate && values.endDate && values.endDate.isBefore(values.startDate)) {
            notifyError(new Error("Ngày kết thúc phải sau ngày bắt đầu"), "Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: UpdateRequestPayload = {
                requestTypeId: values.requestTypeId,
                reason: values.reason?.trim() || undefined,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
                endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
            };

            const res = await updateRequestAPI(id, payload);

            if (handleApiSuccess(res, "Cập nhật đơn thành công!", "Có lỗi xảy ra khi cập nhật đơn")) {
                setTimeout(() => navigate("/request"), 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi cập nhật đơn");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Disable endDate dates before startDate
    const disabledEndDate = (current: Dayjs | null) => {
        const startDate = form.getFieldValue("startDate");
        if (!startDate) return false;
        return (current && current.isBefore(startDate, "day")) || false;
    };

    if (loading) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
                <Card>
                    <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                        <Spin size="large" />
                        <Typography.Text>Đang tải thông tin đơn...</Typography.Text>
                    </Space>
                </Card>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
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
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Cập nhật đơn
                    </Title>

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label="Loại đơn"
                            name="requestTypeId"
                            rules={[{ required: true, message: "Vui lòng chọn loại đơn" }]}
                        >
                            <Select
                                placeholder="Chọn loại đơn"
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                }
                                options={requestTypes.map((rt) => ({
                                    value: rt.id,
                                    label: rt.name,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Lý do"
                            name="reason"
                            rules={[{ max: 500, message: "Lý do không được quá 500 ký tự" }]}
                        >
                            <TextArea
                                rows={4}
                                placeholder="Nhập lý do xin đơn (tùy chọn)"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ngày bắt đầu"
                            name="startDate"
                            tooltip="Chọn ngày bắt đầu (tùy chọn, nếu đơn có thời hạn)"
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày bắt đầu"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ngày kết thúc"
                            name="endDate"
                            tooltip="Chọn ngày kết thúc (tùy chọn, nếu đơn có thời hạn)"
                            dependencies={["startDate"]}
                        >
                            <DatePicker
                                style={{ width: "100%" }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày kết thúc"
                                disabledDate={disabledEndDate}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                                    Cập nhật
                                </Button>
                                <Button onClick={() => navigate("/request")}>Hủy</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default UpdateRequestPage;

