// Export all hooks

// Request hooks
export {
  useRequestList,
  useRequest,
  useRequestStatusCounts,
  useCreateRequest,
  useUpdateRequest,
  useDeleteRequest,
  useDeclineRequest,
} from "./use-requests";

// Quote hooks
export {
  useQuoteList,
  useQuote,
  useQuoteByRequestId,
  useQuoteStatusCounts,
  useCreateQuote,
  useUpdateQuote,
  useSendQuote,
  useRespondToQuote,
} from "./use-quotes";

// Job hooks
export {
  useJobList,
  useJob,
  useJobByQuoteId,
  useJobByRequestId,
  useJobStatusCounts,
  useCreateJob,
  useUpdateJob,
  useUpdateJobStatus,
  useRealtimeJobs,
  useRealtimeJob,
} from "./use-jobs";

// Document hooks
export {
  useDocumentList,
  useJobDocuments,
  useDocumentTypeCounts,
  useCreateDocument,
  useDeleteDocument,
} from "./use-documents";

// Company hooks
export {
  useCompanyList,
  useCompany,
  useCompanySearch,
  useCompanyUsers,
  useCreateCompany,
  useUpdateCompany,
  // Locations
  useCompanyLocations,
  useCompanyLocation,
  useCreateCompanyLocation,
  useUpdateCompanyLocation,
  useDeleteCompanyLocation,
  useSetLocationAsPrimary,
} from "./use-companies";

// Admin hooks
export { useInviteUser } from "./use-invite-user";
export { useDeactivateUser } from "./use-deactivate-user";

// User hooks
export { useCurrentUser, type CurrentUserProfile } from "./use-current-user";

// File upload hooks
export { useFileUpload } from "./use-file-upload";

// Form submit hooks
export { useSubmitLogistics } from "./use-submit-logistics";
export type { LocalLogisticsFormData } from "./use-submit-logistics";
export { useSubmitMaterials } from "./use-submit-materials";
export type { LocalMaterialsFormData } from "./use-submit-materials";

// Timeline hooks
export { useTimeline, useRequestFullTimeline, useCreateTimelineEvent } from "./use-timeline";

// Invoice hooks
export {
  useInvoiceList,
  useInvoice,
  useJobInvoices,
  useInvoiceStatusCounts,
  useUpdateInvoice,
  useLinkInvoiceToJob,
  useSyncInvoices,
  useQuickBooksStatus,
  useDisconnectQuickBooks,
  useRealtimeInvoices,
  useDownloadInvoicePdf,
  useInvoiceStats,
  useInvoiceFilters,
} from "./use-invoices";

// Utility hooks
export { useListPage, useTabFilter } from "./use-list-page";
export { useFormSubmit } from "./use-form-submit";
export { useDocumentOperations } from "./use-document-operations";
export { usePagination } from "./use-pagination";

// Calendar hooks
export { useCalendarNavigation, useCalendarJobs } from "./use-calendar";

// Notification hooks
export {
  useNotifications,
  useUnreadNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
  useRealtimeNotifications,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useRegisterPushSubscription,
} from "./use-notifications";
