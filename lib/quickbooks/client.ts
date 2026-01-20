import { QB_CONFIG } from "./auth";

// API base URLs
const API_BASE_URLS = {
  sandbox: "https://sandbox-quickbooks.api.intuit.com",
  production: "https://quickbooks.api.intuit.com",
};

export interface QuickBooksInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  CustomerRef: {
    value: string;
    name: string;
  };
  Line: Array<{
    Id: string;
    Description?: string;
    Amount: number;
    DetailType: string;
  }>;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface QuickBooksCustomer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: {
    Address: string;
  };
}

/**
 * QuickBooks API client
 */
export class QuickBooksClient {
  private accessToken: string;
  private realmId: string;
  private baseUrl: string;

  constructor(accessToken: string, realmId: string) {
    this.accessToken = accessToken;
    this.realmId = realmId;
    this.baseUrl = API_BASE_URLS[QB_CONFIG.environment];
  }

  /**
   * Make an authenticated request to the QuickBooks API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/v3/company/${this.realmId}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QuickBooks API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get all invoices
   */
  async getInvoices(
    modifiedSince?: Date
  ): Promise<QuickBooksInvoice[]> {
    let query = "SELECT * FROM Invoice";

    if (modifiedSince) {
      const formattedDate = modifiedSince.toISOString().split("T")[0];
      query += ` WHERE MetaData.LastUpdatedTime > '${formattedDate}'`;
    }

    query += " MAXRESULTS 1000";

    const response = await this.request<{
      QueryResponse: { Invoice?: QuickBooksInvoice[] };
    }>(`/query?query=${encodeURIComponent(query)}`);

    return response.QueryResponse.Invoice || [];
  }

  /**
   * Get a single invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<QuickBooksInvoice> {
    const response = await this.request<{ Invoice: QuickBooksInvoice }>(
      `/invoice/${invoiceId}`
    );
    return response.Invoice;
  }

  /**
   * Get invoice PDF
   */
  async getInvoicePdf(invoiceId: string): Promise<ArrayBuffer> {
    const url = `${this.baseUrl}/v3/company/${this.realmId}/invoice/${invoiceId}/pdf`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/pdf",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get invoice PDF: ${response.status} - ${error}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Get all customers
   */
  async getCustomers(): Promise<QuickBooksCustomer[]> {
    const query = "SELECT * FROM Customer MAXRESULTS 1000";

    const response = await this.request<{
      QueryResponse: { Customer?: QuickBooksCustomer[] };
    }>(`/query?query=${encodeURIComponent(query)}`);

    return response.QueryResponse.Customer || [];
  }

  /**
   * Search customers by name
   */
  async searchCustomers(searchTerm: string): Promise<QuickBooksCustomer[]> {
    // QuickBooks uses LIKE with % wildcard for partial matching
    const escapedTerm = searchTerm.replace(/'/g, "\\'");
    const query = `SELECT * FROM Customer WHERE DisplayName LIKE '%${escapedTerm}%' MAXRESULTS 25`;

    const response = await this.request<{
      QueryResponse: { Customer?: QuickBooksCustomer[] };
    }>(`/query?query=${encodeURIComponent(query)}`);

    return response.QueryResponse.Customer || [];
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(customerId: string): Promise<QuickBooksCustomer> {
    const response = await this.request<{ Customer: QuickBooksCustomer }>(
      `/customer/${customerId}`
    );
    return response.Customer;
  }

  /**
   * Test the connection by fetching company info
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request<unknown>("/companyinfo/" + this.realmId);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Determine invoice status based on balance and due date
 */
export function getInvoiceStatus(
  balance: number,
  dueDate: string
): "paid" | "unpaid" | "overdue" {
  if (balance === 0) {
    return "paid";
  }

  const due = new Date(dueDate);
  const now = new Date();

  if (due < now) {
    return "overdue";
  }

  return "unpaid";
}
