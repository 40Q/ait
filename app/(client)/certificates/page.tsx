import { DocumentLibrary, type DocumentItem } from "@/components/ui/document-library";

// Mock data - includes certificates and all reports
const certificates: DocumentItem[] = [
  {
    id: "1",
    name: "Certificate of Destruction - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "2",
    name: "Certificate of Recycling - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "3",
    name: "HD Serialization Report - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "4",
    name: "Asset Serialization Report - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "5",
    name: "Certificate of Destruction - W2512002.pdf",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    uploadedAt: "Dec 10, 2024",
  },
  {
    id: "6",
    name: "Certificate of Recycling - W2512002.pdf",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    uploadedAt: "Dec 10, 2024",
  },
  {
    id: "7",
    name: "Certificate of Destruction - W2512001.pdf",
    jobId: "W2512001",
    jobName: "Laptop Trade-in Program",
    uploadedAt: "Dec 3, 2024",
  },
  {
    id: "8",
    name: "Certificate of Destruction - W2511002.pdf",
    jobId: "W2511002",
    jobName: "Monitor Recycling Batch",
    uploadedAt: "Nov 25, 2024",
  },
];

export default function CertificatesPage() {
  return (
    <DocumentLibrary
      title="Certificates & Reports"
      description="View and download all your certificates and reports"
      documents={certificates}
      emptyMessage="No certificates or reports yet"
    />
  );
}
