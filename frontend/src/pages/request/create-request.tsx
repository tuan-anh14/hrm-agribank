import { Button, Form, Select, DatePicker, Input, Card, Typography, Space } from "antd";
import type { FormProps } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { getAllEmployeesAPI, getAllRequestTypesAPI, createRequestAPI, createMyRequestAPI } from "@/services/api";
import type { Employee } from "@/types/employee";
import type { RequestType } from "@/types/request";
import type { CreateRequestPayload } from "@/types/request";
import { handleApiSuccess, notifyError } from "@/utils/notification";
import { useCurrentApp } from "@/components/context/app.context";

const { Title } = Typography;
const { TextArea } = Input;

type FieldType = {
    employeeId?: string;
    requestTypeId: string;
    reason?: string;
    startDate?: dayjs.Dayjs;
    endDate?: dayjs.Dayjs;
};

const CreateRequestPage: React.FC = () => {
    const { user } = useCurrentApp();
    const [form] = Form.useForm<FieldType>();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);

    const isAdmin = user?.role === "ADMIN";
    const isHR = user?.role === "HR";
    const isEmployee = !isAdmin && !isHR;

    useEffect(() => {
        if (isEmployee && user?.id) {
            form.setFieldsValue({ employeeId: user.id });
        }
    }, [isEmployee, user?.id, form]);

    useEffect(() => {
        const loadEmployees = async () => {
            if (isEmployee) return;
            try {
                const res = await getAllEmployeesAPI();
                const list: Employee[] = Array.isArray(res)
                    ? res
                    : Array.isArray((res as any)?.data)
                        ? (res as any).data
                        : [];
                setEmployees(list);
            } catch (error) {
                console.error("Error loading employees", error);
            }
        };

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

        loadEmployees();
        loadRequestTypes();
    }, [isEmployee]);

    const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
        if (!values.requestTypeId) {
            notifyError(new Error("Vui lòng chọn loại đơn"), "Vui lòng chọn loại đơn");
            return;
        }

        // Validate date range
        if (values.startDate && values.endDate && values.endDate.isBefore(values.startDate)) {
            notifyError(new Error("Ngày kết thúc phải sau ngày bắt đầu"), "Ngày kết thúc phải sau ngày bắt đầu");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: CreateRequestPayload = {
                requestTypeId: values.requestTypeId,
                reason: values.reason?.trim() || undefined,
                startDate: values.startDate ? values.startDate.format("YYYY-MM-DD") : undefined,
                endDate: values.endDate ? values.endDate.format("YYYY-MM-DD") : undefined,
            };

            let res;
            if (isEmployee) {
                // Employee tự động tạo đơn cho chính mình
                res = await createMyRequestAPI(payload);
            } else {
                // Admin/HR cần chọn employee
                if (!values.employeeId) {
                    notifyError(new Error("Vui lòng chọn nhân viên"), "Vui lòng chọn nhân viên");
                    setIsSubmitting(false);
                    return;
                }
                res = await createRequestAPI({
                    ...payload,
                    employeeId: values.employeeId,
                });
            }

            const successMsg = isEmployee ? "Tạo đơn thành công!" : "Tạo đơn cho nhân viên thành công!";
            if (handleApiSuccess(res, successMsg, "Có lỗi xảy ra khi tạo đơn")) {
                form.resetFields();
                setTimeout(() => navigate("/request"), 1500);
            }
        } catch (error: any) {
            notifyError(error, "Có lỗi xảy ra khi tạo đơn");
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

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
            <Card>
                <Space direction="vertical" size={24} style={{ width: "100%" }}>
                    <Title level={2} style={{ margin: 0 }}>
                        {isEmployee ? "Tạo đơn mới" : "Tạo đơn cho nhân viên"}
                    </Title>

                    <Form<FieldType>
                        form={form}
                        layout="vertical"
                        size="large"
                        onFinish={onFinish}
                    >
                        {!isEmployee && (
                            <Form.Item
                                label="Nhân viên"
                                name="employeeId"
                                rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                            >
                                <Select
                                    placeholder="Chọn nhân viên"
                                    showSearch
                                    optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={employees.map((emp) => ({
                                        value: emp.id,
                                        label: `${emp.fullName}${emp.email ? ` (${emp.email})` : ""}`,
                                    }))}
                                />
                            </Form.Item>
                        )}

                        {/* Hidden field for employeeId when isEmployee is true */}
                        {isEmployee && (
                            <Form.Item name="employeeId" hidden>
                                <Input />
                            </Form.Item>
                        )}

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
                                disabledDate={(current) => current && current < dayjs().startOf("day")}
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
                                    {isEmployee ? "Gửi đơn" : "Tạo đơn"}
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

export default CreateRequestPage;

