import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function DocumentType({ docType }: { docType: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs',
        {
          'bg-gray-100 text-gray-500': docType === 'agreement',
          'bg-gray-100 text-gray-501': docType === 'title deed',
          'bg-gray-100 text-gray-502': docType === 'last will'
        },
      )}
    >
      {docType === 'agreement' ? (
        <>
          Agreement
          {/* <ClockIcon className="ml-1 w-4 text-gray-500" /> */}
        </>
      ) : null}
      {docType === 'title deed' ? (
        <>
          Title deed
          { /* <CheckIcon className="ml-1 w-4 text-white" /> */ }
        </>
      ) : null}
      {docType === 'last will' ? (
        <>
          Last will
          { /* <CheckIcon className="ml-1 w-4 text-white" /> */}
        </>
      ) : null}
    </span>
  );
}
