'use client';

import { CustomerField, DocumentForm } from '@/app/lib/definitions';
import {
  CheckIcon,
  ClockIcon,
  PencilIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { verifyDocument, State } from '@/app/lib/actions';
import { useActionState } from 'react';

export default function VerifyDocumentForm({
  document,
  customers,
}: {
  document: DocumentForm;
  customers: CustomerField[];
}) {
  const initialState: State = { message: null, errors: {} };
  const verifyDocumentWithId = verifyDocument.bind(null, document.id);
  const [state, formAction] = useActionState(verifyDocumentWithId, initialState);
  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="customer" className="mb-2 block text-sm font-medium">
            Choose customer
          </label>
          <div className="relative">
            <select
              id="customer"
              name="customerId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={document.customer_id}
              disabled
            >
              <option value="" disabled>
                Select a customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Document Type */}
        <fieldset disabled>
          <legend className="mb-2 block text-sm font-medium">
            Set the document type
          </legend>
          <div className="rounded-md border border-gray-200 bg-white px-[14px] py-3">
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  id="agreement"
                  name="documentType"
                  type="radio"
                  value="agreement"
                  defaultChecked={document.doc_type === 'agreement'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                <label
                  htmlFor="agreement"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Agreement {/* <ClockIcon className="h-4 w-4" /> */}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="title deed"
                  name="documentType"
                  type="radio"
                  value="title deed"
                  defaultChecked={document.doc_type === 'title deed'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                <label
                  htmlFor="title deed"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Title deed {/* <CheckIcon className="h-4 w-4" /> */}
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="last will"
                  name="documentType"
                  type="radio"
                  value="last will"
                  defaultChecked={document.doc_type === 'last will'}
                  className="h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-gray-600 focus:ring-2"
                />
                <label
                  htmlFor="last will"
                  className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600"
                >
                  Last will {/* <CheckIcon className="h-4 w-4" /> */}
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Document Name */}
        <div className="mb-4">
          <label htmlFor="documentName" className="mb-2 block text-sm font-medium">
            Choose document name
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="documentName"
                name="documentName"
                type="string"
                defaultValue={document.doc_name}
                placeholder="Enter Document name"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                disabled
              />
              <PencilIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

        {/* Document Description */}
        <div className="mb-4">
          <label htmlFor="documentDescription" className="mb-2 block text-sm font-medium">
            Choose document description
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="documentDescription"
                name="documentDescription"
                type="string"
                defaultValue={document.doc_description}
                placeholder="Enter Document description"
                maxLength="100"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                disabled
              />
              <PencilIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

        {/* Document File */}
        <div className="mb-4">
          <label htmlFor="documentFile" className="mb-2 block text-sm font-medium">
            Choose document file
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="documentFile"
                name="documentFile"
                type="file"
                placeholder="Choose Document file"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-4 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="document-file-error"
                required
              />
            </div>
            <div id="document-file-error" aria-live="polite" aria-atomic="true">
              {state.errors?.documentFile &&
                state.errors.documentFile.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>
        {/* Display message */}
        {state.message && <p className="mt-2 text-red-500">{state.message}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/documents"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Verify Document</Button>
      </div>
    </form>
  );
}
