import AdminHeader from '@/components/admin/AdminHeader';
import DropForm from '@/components/admin/DropForm';

export default function NewDropPage() {
  return (
    <div>
      <AdminHeader
        title="Nuevo drop"
        description="Programa un lanzamiento y elige sus productos."
        backHref="/admin/drops"
      />
      <DropForm />
    </div>
  );
}
