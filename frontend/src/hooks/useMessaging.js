import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as messagingService from "../services/messagingService";

/**
 * useMessaging Hook - Messaging operations
 */
export function useMessaging() {
  const queryClient = useQueryClient();

  // Get messaging stats
  const useMessagingStats = () => {
    return useQuery({
      queryKey: ["messaging-stats"],
      queryFn: () => messagingService.getMessagingStats(),
    });
  };

  // Get daily report for a date
  const useDailyReport = (date) => {
    return useQuery({
      queryKey: ["daily-report", date],
      queryFn: () => messagingService.getDailyReport(date),
      enabled: !!date,
    });
  };

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      return messagingService.sendMessage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
    },
  });

  // Send test message
  const sendTestMessageMutation = useMutation({
    mutationFn: async (data) => {
      return messagingService.sendTestMessage(data);
    },
  });

  // Send bulk message
  const sendBulkMessageMutation = useMutation({
    mutationFn: async (data) => {
      return messagingService.sendBulkMessage(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messaging-stats"] });
    },
  });

  // Get message templates
  const useMessageTemplates = () => {
    return useQuery({
      queryKey: ["message-templates"],
      queryFn: () => messagingService.getMessageTemplates(),
    });
  };

  // Create template
  const createTemplateMutation = useMutation({
    mutationFn: async (data) => {
      return messagingService.createMessageTemplate(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });

  // Get message history
  const useMessageHistory = (params) => {
    return useQuery({
      queryKey: ["message-history", params],
      queryFn: () => messagingService.getMessageHistory(params),
      enabled: !!params,
    });
  };

  return {
    useMessagingStats,
    useDailyReport,
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
    sendTestMessage: sendTestMessageMutation.mutate,
    isSendingTest: sendTestMessageMutation.isPending,
    sendBulkMessage: sendBulkMessageMutation.mutate,
    isSendingBulk: sendBulkMessageMutation.isPending,
    useMessageTemplates,
    createTemplate: createTemplateMutation.mutate,
    isCreatingTemplate: createTemplateMutation.isPending,
    useMessageHistory,
  };
}
