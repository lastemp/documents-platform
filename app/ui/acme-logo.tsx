import { GlobeAltIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <ClipboardDocumentCheckIcon className="h-12 w-12 rotate-[15deg]" />
      <p className="text-[44px]">Elora</p>
    </div>
  );
}
