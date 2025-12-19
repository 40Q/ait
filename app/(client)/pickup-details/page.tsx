import { DocumentLibrary, type DocumentItem } from "@/components/ui/document-library";

// Mock data
const pickupDetails: DocumentItem[] = [
  {
    id: "1",
    name: "Bill of Lading - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 10, 2024",
  },
  {
    id: "2",
    name: "Equipment Manifest - W2512003.pdf",
    jobId: "W2512003",
    jobName: "Q4 Office Equipment Recycling",
    uploadedAt: "Dec 10, 2024",
  },
  {
    id: "3",
    name: "Bill of Lading - W2512002.pdf",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    uploadedAt: "Dec 5, 2024",
  },
  {
    id: "4",
    name: "Equipment Manifest - W2512002.pdf",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    uploadedAt: "Dec 5, 2024",
  },
  {
    id: "5",
    name: "Asset Serial List - W2512002.pdf",
    jobId: "W2512002",
    jobName: "Server Room Decommission",
    uploadedAt: "Dec 5, 2024",
  },
  {
    id: "6",
    name: "Bill of Lading - W2511003.pdf",
    jobId: "W2511003",
    jobName: "E-waste Collection",
    uploadedAt: "Dec 12, 2024",
  },
];

export default function PickupDetailsPage() {
  return (
    <DocumentLibrary
      title="Pickup Details"
      description="View and download all pickup documents (Bills of Lading, Manifests)"
      documents={pickupDetails}
      emptyMessage="No pickup documents yet"
    />
  );
}
