import Form from '@/app/ui/documents/create-form';
import Breadcrumbs from '@/app/ui/documents/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents create',
};
 
export default async function Page() {
  const customers = await fetchCustomers();
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Documents', href: '/dashboard/documents' },
          {
            label: 'Create Document',
            href: '/dashboard/documents/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}