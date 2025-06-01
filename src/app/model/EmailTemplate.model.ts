export interface EmailTemplate {
  emailTemplateId: number;
  subject: string;
  body: string;
  createdUser: string;
  createdTimestamp: string;
  updatedUser?: string;
  updatedTimestamp?: string;
}

export interface EmailTemplateForm {
  emailTemplateId?: number;
  createUser?: string;
  updateUser?: string;
  subject: string;
  body: string;
}
