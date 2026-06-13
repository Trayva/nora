import api from "./axios";

export const getMyTickets = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const { data } = await api.get(`/tickets?${query}`);
  return data.data;
};

export const getTicketDetails = async (ticketId) => {
  const { data } = await api.get(`/tickets/${ticketId}`);
  return data.data;
};

export const createTicket = async (ticketData) => {
  const { data } = await api.post(`/tickets`, ticketData);
  return data.data;
};

// Public guest ticket — no authentication required
export const publicCreateTicket = async (ticketData) => {
  const { data } = await api.post(`/public-tickets/guest`, ticketData);
  return data;
};

export const replyToTicket = async (ticketId, replyData) => {
  const { data } = await api.post(`/tickets/${ticketId}/messages`, replyData);
  return data.data;
};

// Admin Endpoints
export const adminGetAllTickets = async (filters = {}) => {
  const query = new URLSearchParams(filters).toString();
  const { data } = await api.get(`/admin-tickets?${query}`);
  return data.data;
};

export const adminGetTicketDetails = async (ticketId) => {
  const { data } = await api.get(`/admin-tickets/${ticketId}`);
  return data.data;
};

export const adminUpdateTicket = async (ticketId, updates) => {
  const { data } = await api.patch(`/admin-tickets/${ticketId}`, updates);
  return data.data;
};

export const adminReplyToTicket = async (ticketId, replyData) => {
  const { data } = await api.post(`/admin-tickets/${ticketId}/messages`, replyData);
  return data.data;
};
