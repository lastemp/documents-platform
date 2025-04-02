import Form from '@/app/ui/clients/create-form';
import Breadcrumbs from '@/app/ui/clients/breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clients create',
};
 
export default async function Page() {
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Clients', href: '/dashboard/clients' },
          {
            label: 'Create Client',
            href: '/dashboard/clients/create',
            active: true,
          },
        ]}
      />
      <Form/>
    </main>
  );
}