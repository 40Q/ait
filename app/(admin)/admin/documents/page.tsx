"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  jobId: string;
  companyId: string;
  companyName: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
}

// Mock data
const documents: DocumentItem[] = [
  {
    id: "1",
    name: "Certificate_of_Destruction_W2512005.pdf",
    type: "certificate_of_destruction",
    typeLabel: "Certificate of Destruction",
    jobId: "W2512005",
    companyId: "4",
    companyName: "DataFlow LLC",
    uploadedAt: "Dec 12, 2024",
    uploadedBy: "Admin",
    fileSize: "156 KB",
  },
  {
    id: "2",
    name: "HD_Serialization_Report_W2512005.pdf",
    type: "hd_serialization",
    typeLabel: "HD Serialization Report",
    jobId: "W2512005",
    companyId: "4",
    companyName: "DataFlow LLC",
    uploadedAt: "Dec 12, 2024",
    uploadedBy: "Admin",
    fileSize: "245 KB",
  },
  {
    id: "3",
    name: "Pickup_Manifest_W2512007.pdf",
    type: "pickup_document",
    typeLabel: "Pickup Document",
    jobId: "W2512007",
    companyId: "1",
    companyName: "Acme Corporation",
    uploadedAt: "Dec 15, 2024",
    uploadedBy: "Admin",
    fileSize: "89 KB",
  },
  {
    id: "4",
    name: "Certificate_of_Recycling_W2512004.pdf",
    type: "certificate_of_recycling",
    typeLabel: "Certificate of Recycling",
    jobId: "W2512004",
    companyId: "1",
    companyName: "Acme Corporation",
    uploadedAt: "Dec 8, 2024",
    uploadedBy: "Admin",
    fileSize: "134 KB",
  },
  {
    id: "5",
    name: "Asset_Serialization_W2512004.pdf",
    type: "asset_serialization",
    typeLabel: "Asset Serialization Report",
    jobId: "W2512004",
    companyId: "1",
    companyName: "Acme Corporation",
    uploadedAt: "Dec 8, 2024",
    uploadedBy: "Admin",
    fileSize: "312 KB",
  },
];

const documentTypes = [
  { value: "all", label: "All Types" },
  { value: "certificate_of_destruction", label: "Certificate of Destruction" },
  { value: "certificate_of_recycling", label: "Certificate of Recycling" },
  { value: "hd_serialization", label: "HD Serialization Report" },
  { value: "asset_serialization", label: "Asset Serialization Report" },
  { value: "warehouse_report", label: "Warehouse Processing Report" },
  { value: "pickup_document", label: "Pickup Document" },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.jobId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesCompany =
      companyFilter === "all" || doc.companyId === companyFilter;

    return matchesSearch && matchesType && matchesCompany;
  });

  // Get unique companies for filter
  const companies = Array.from(
    new Map(documents.map((d) => [d.companyId, d.companyName])).entries()
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="View and manage all uploaded documents"
      >
        <Button asChild>
          <Link href="/admin/jobs">
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, job ID, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{doc.typeLabel}</Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/jobs/${doc.jobId}`}
                    className="font-mono text-sm hover:underline"
                  >
                    {doc.jobId}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/companies/${doc.companyId}`}
                    className="hover:underline"
                  >
                    {doc.companyName}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{doc.uploadedAt}</p>
                    <p className="text-xs text-muted-foreground">
                      by {doc.uploadedBy}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {doc.fileSize}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">No documents found</p>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredDocuments.length} of {documents.length} documents
      </p>
    </div>
  );
}
