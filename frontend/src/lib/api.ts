import {
  UserProfile,
  Institution,
  Department,
  ResearchInterest,
  ProfessorProfile,
  Publication,
  ResearchProject,
  ResearchRequest,
  RequestMessage,
  DocumentRecord,
  PaperSummary,
  NotificationItem,
  SkillPassport,
  ResearchIdea,
  IdeaProposal,
  StudentContribution,
  OpportunityRadarAlert,
  OpportunityRadarResponse,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("rb_auth_token", token);
      else localStorage.removeItem("rb_auth_token");
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      return localStorage.getItem("rb_auth_token");
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errData: any;
        try {
          errData = await response.json();
        } catch {
          errData = { detail: response.statusText };
        }
        const message =
          errData?.detail ||
          errData?.error?.message ||
          `Request failed with status ${response.status}`;
        throw new ApiError(response.status, message, errData);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(0, err?.message || "Network connection error");
    }
  }

  // Auth & Profile
  async getAuthMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/auth/me");
  }

  async getProfileMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/profiles/me");
  }

  async updateProfileMe(payload: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>("/profiles/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async requestProfessorOnboarding(payload: {
    institution_id: string;
    academic_title: string;
    institutional_email: string;
    department_id?: string;
    verification_notes?: string;
  }) {
    return this.request("/onboarding/professor-request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Metadata
  async getInstitutions(): Promise<Institution[]> {
    const res = await this.request<any>("/institutions");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getDepartments(institutionId?: string): Promise<Department[]> {
    const query = institutionId ? `?institution_id=${institutionId}` : "";
    const res = await this.request<any>(`/departments${query}`);
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getResearchInterests(): Promise<ResearchInterest[]> {
    const res = await this.request<any>("/research-interests");
    return Array.isArray(res) ? res : res?.items || [];
  }

  // Professors
  async getProfessors(params?: {
    search?: string;
    department_id?: string;
    interest?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProfessorProfile[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.department_id) q.append("department_id", params.department_id);
    if (params?.interest) q.append("interest", params.interest);
    if (params?.limit) q.append("limit", params.limit.toString());
    const query = q.toString() ? `?${q.toString()}` : "";
    const res = await this.request<any>(`/professors${query}`);
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getProfessor(id: string): Promise<ProfessorProfile> {
    return this.request<ProfessorProfile>(`/professors/${id}`);
  }

  async getProfessorDashboard(): Promise<any> {
    return this.request<any>("/professors/me/dashboard");
  }

  async updateProfessorMe(payload: any): Promise<ProfessorProfile> {
    return this.request<ProfessorProfile>("/professors/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Publications
  async getProfessorPublications(profId: string): Promise<Publication[]> {
    const res = await this.request<any>(`/professors/${profId}/publications`);
    return Array.isArray(res) ? res : res?.items || [];
  }

  async createPublication(payload: Partial<Publication>): Promise<Publication> {
    return this.request<Publication>("/publications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updatePublication(id: string, payload: Partial<Publication>): Promise<Publication> {
    return this.request<Publication>(`/publications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  async deletePublication(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/publications/${id}`, {
      method: "DELETE",
    });
  }

  // Research Projects
  async getProjects(params?: {
    search?: string;
    department_id?: string;
    status?: string;
    limit?: number;
  }): Promise<ResearchProject[]> {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.department_id) q.append("department_id", params.department_id);
    if (params?.status) q.append("status", params.status);
    if (params?.limit) q.append("limit", params.limit.toString());
    const query = q.toString() ? `?${q.toString()}` : "";
    const res = await this.request<any>(`/research-projects${query}`);
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getProfessorProjects(): Promise<ResearchProject[]> {
    const res = await this.request<any>("/professors/me/research-projects");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getProject(id: string): Promise<ResearchProject> {
    return this.request<ResearchProject>(`/research-projects/${id}`);
  }

  async createProject(payload: Partial<ResearchProject>): Promise<ResearchProject> {
    return this.request<ResearchProject>("/research-projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateProject(id: string, payload: Partial<ResearchProject>): Promise<ResearchProject> {
    return this.request<ResearchProject>(`/research-projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  // Research Requests
  async getResearchRequests(): Promise<ResearchRequest[]> {
    const res = await this.request<any>("/research-requests");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getResearchRequest(id: string): Promise<ResearchRequest> {
    return this.request<ResearchRequest>(`/research-requests/${id}`);
  }

  async createResearchRequest(payload: {
    professor_id: string;
    project_id?: string;
    subject: string;
    motivation_statement: string;
    student_skills: string[];
    proposed_availability_hours: number;
    supporting_document_id?: string;
  }): Promise<ResearchRequest> {
    return this.request<ResearchRequest>("/research-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitResearchRequest(payload: {
    professor_id: string;
    project_id?: string;
    subject: string;
    motivation_statement: string;
    student_skills: string[];
    proposed_availability_hours: number;
    supporting_document_id?: string;
  }): Promise<ResearchRequest> {
    return this.createResearchRequest(payload);
  }

  async acceptRequest(id: string, notes?: string): Promise<ResearchRequest> {
    return this.request<ResearchRequest>(`/research-requests/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async rejectRequest(id: string, notes?: string): Promise<ResearchRequest> {
    return this.request<ResearchRequest>(`/research-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async requestInfo(id: string, notes: string): Promise<ResearchRequest> {
    return this.request<ResearchRequest>(
      `/research-requests/${id}/request-information`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );
  }

  async withdrawRequest(id: string): Promise<ResearchRequest> {
    return this.request<ResearchRequest>(`/research-requests/${id}/withdraw`, {
      method: "POST",
    });
  }

  // Messaging
  async getMessages(requestId: string): Promise<{ messages: RequestMessage[]; total: number }> {
    const res = await this.request<any>(
      `/research-requests/${requestId}/messages`
    );
    const msgs = Array.isArray(res) ? res : res?.items || res?.messages || [];
    return {
      messages: msgs,
      total: res?.total || msgs.length,
    };
  }

  async sendMessage(
    requestId: string,
    messageBody: string,
    isInternalNote = false
  ): Promise<RequestMessage> {
    return this.request<RequestMessage>(
      `/research-requests/${requestId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          message_body: messageBody,
          is_internal_note: isInternalNote,
        }),
      }
    );
  }

  async markMessagesRead(requestId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/research-requests/${requestId}/read`,
      {
        method: "POST",
      }
    );
  }

  // Documents
  async getDocuments(): Promise<DocumentRecord[]> {
    const res = await this.request<any>("/documents");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async uploadDocument(formData: FormData): Promise<DocumentRecord> {
    return this.request<DocumentRecord>("/documents", {
      method: "POST",
      body: formData,
    });
  }

  async summarizeDocument(docId: string): Promise<PaperSummary> {
    return this.request<PaperSummary>(`/documents/${docId}/summarize`, {
      method: "POST",
    });
  }

  async getDocumentSummary(docId: string): Promise<PaperSummary> {
    return this.request<PaperSummary>(`/documents/${docId}/summary`);
  }

  // AI Assistant
  async sendAiChat(payload: {
    message: string;
    conversation_id?: string;
    document_id?: string;
    context_type?: string;
    context_id?: string;
  }): Promise<{ reply: string; message: string; conversation_id: string; citations?: any[] }> {
    const res = await this.request<any>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      conversation_id: res.conversation_id,
      reply: res.reply || res.message || "",
      message: res.message || res.reply || "",
      citations: res.citations || [],
    };
  }

  async getAiConversations(): Promise<any[]> {
    const res = await this.request<any>("/ai/conversations");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async breakdownProject(researchIdea: string): Promise<any> {
    return this.request<any>("/ai/project-breakdown", {
      method: "POST",
      body: JSON.stringify({ research_idea: researchIdea }),
    });
  }

  async breakdownProjectIdea(researchIdea: string): Promise<any> {
    return this.breakdownProject(researchIdea);
  }

  // Recommendations
  async getRecommendedProfessors(): Promise<any[]> {
    const res = await this.request<any>("/recommendations/professors");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getRecommendedProjects(): Promise<any[]> {
    const res = await this.request<any>("/recommendations/projects");
    return Array.isArray(res) ? res : res?.items || [];
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await this.request<any>("/notifications");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/notifications/read-all", {
      method: "POST",
    });
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "POST",
    });
  }

  // 11 Innovation Features
  async getTalentMatcher(projectId: string): Promise<any> {
    return this.request<any>(
      `/recommendations/projects/${projectId}/talent-matcher`
    );
  }

  async getSkillPassport(studentId?: string): Promise<SkillPassport[]> {
    const q = studentId ? `?student_id=${studentId}` : "";
    const res = await this.request<any>(`/skills/passport${q}`);
    return Array.isArray(res) ? res : res?.items || [];
  }

  async addSkillPassport(payload: {
    skill_name: string;
    proficiency_level: string;
    verification_tier?: string;
    evidence_url?: string;
  }): Promise<SkillPassport> {
    return this.request<SkillPassport>("/skills/passport", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async endorseSkill(
    skillId: string,
    payload: { endorsement_notes?: string; verified_proficiency?: string }
  ): Promise<SkillPassport> {
    return this.request<SkillPassport>(`/skills/passport/${skillId}/endorse`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async composeTeam(payload: {
    project_title: string;
    roles: Array<{ role_name: string; required_skills: string[] }>;
  }): Promise<any> {
    return this.request<any>("/teams/compose", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getProjectGapAnalysis(projectId: string): Promise<any> {
    return this.request<any>(`/research-projects/${projectId}/gap-analysis`);
  }

  async getPipelineIdeas(): Promise<ResearchIdea[]> {
    const res = await this.request<any>("/pipeline/ideas");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async createPipelineIdea(payload: {
    title: string;
    problem_statement: string;
    vision_description: string;
    tags?: string[];
  }): Promise<ResearchIdea> {
    return this.request<ResearchIdea>("/pipeline/ideas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async submitIdeaProposal(
    ideaId: string,
    payload: {
      proposal_title: string;
      proposed_approach: string;
      contributor_role: string;
    }
  ): Promise<IdeaProposal> {
    return this.request<IdeaProposal>(`/pipeline/ideas/${ideaId}/proposals`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async logContribution(payload: {
    project_id: string;
    task_name: string;
    deliverable_summary: string;
    hours_logged: number;
  }): Promise<StudentContribution> {
    return this.request<StudentContribution>("/contributions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getContributionPortfolio(studentId: string): Promise<any> {
    return this.request<any>(`/contributions/portfolio/${studentId}`);
  }

  async getCrossDepartmentRecommendations(skill?: string): Promise<any> {
    const q = skill ? `?skill=${encodeURIComponent(skill)}` : "";
    return this.request<any>(`/recommendations/cross-department${q}`);
  }

  async getOpportunityRadar(): Promise<OpportunityRadarResponse> {
    const res = await this.request<any>("/opportunities/radar");
    return {
      student_id: res?.student_id || "",
      radar_opportunities: res?.radar_opportunities || (Array.isArray(res) ? res : []),
    };
  }

  async getCollaborationGraph(): Promise<any> {
    return this.request<any>("/collaboration-graph");
  }

  // Admin
  async getAdminAuditLogs(): Promise<any[]> {
    const res = await this.request<any>("/admin/audit-logs");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async getPendingProfessors(): Promise<any[]> {
    const res = await this.request<any>("/admin/professors/pending");
    return Array.isArray(res) ? res : res?.items || [];
  }

  async approveProfessor(
    id: string,
    payload: { admin_notes?: string }
  ): Promise<any> {
    return this.request<any>(`/admin/professors/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async rejectProfessor(
    id: string,
    payload: { admin_notes?: string }
  ): Promise<any> {
    return this.request<any>(`/admin/professors/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async suspendUser(userId: string, reason: string): Promise<any> {
    return this.request<any>(`/admin/users/${userId}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateUser(userId: string): Promise<any> {
    return this.request<any>(`/admin/users/${userId}/reactivate`, {
      method: "POST",
    });
  }

  async getFairOpportunityMetrics(): Promise<any> {
    return this.request<any>("/admin/fair-opportunity-monitor");
  }
}

export const api = new ApiClient();
