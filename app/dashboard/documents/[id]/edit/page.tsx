import Form from '@/app/ui/documents/edit-form';
import Breadcrumbs from '@/app/ui/documents/breadcrumbs';
import { fetchDocumentById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents edit',
};
 
export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [document, customers] = await Promise.all([
        fetchDocumentById(id),
        fetchCustomers(),
    ]);

    if (!document) {
      notFound();
    }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Documents', href: '/dashboard/documents' },
          {
            label: 'Edit Document',
            href: `/dashboard/documents/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form document={document} customers={customers} />
    </main>
  );
}