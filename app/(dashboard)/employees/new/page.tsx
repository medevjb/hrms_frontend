import { PageHeader } from "@/components/ui/PageHeader";
import { CreateEmployeeForm } from "@/features/employees/CreateEmployeeForm";

export default function NewEmployeePage() {
  return (
    <>
      <PageHeader
        title="Invite an employee"
        description="They'll receive an email to set their password and get started."
      />
      <CreateEmployeeForm />
    </>
  );
}
