import Image from 'next/image';
import { UpdateDocument, DeleteDocument } from '@/app/ui/documents/buttons';
import DocumentType from '@/app/ui/documents/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { fetchFilteredDocuments } from '@/app/lib/data';

export default async function DocumentsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const documents = await fetchFilteredDocuments(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {documents?.map((document) => (
              <div
                key={document.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <Image
                        src={document.image_url}
                        className="mr-2 rounded-full"
                        width={28}
                        height={28}
                        alt={`${document.name}'s profile picture`}
                      />
                      <p>{document.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{document.email}</p>
                  </div>
                  {/* <DocumentType docType={document.doc_type} /> */}
                  {document.doc_name}
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-xl font-medium">
                      {/* {document.doc_name} */}
                      <DocumentType docType={document.doc_type} />
                    </p>
                    <p>{formatDateToLocal(document.date)}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateDocument id={document.id} />
                    <DeleteDocument id={document.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Doc Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Doc Type
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {documents?.map((document) => (
                <tr
                  key={document.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={document.image_url}
                        className="rounded-full"
                        width={28}
                        height={28}
                        alt={`${document.name}'s profile picture`}
                      />
                      <p>{document.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {document.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {document.doc_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <DocumentType docType={document.doc_type} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(document.date)}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateDocument id={document.id} />
                      <DeleteDocument id={document.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
