export const apiEndpoints = {
  patients: {
    list: '/pacientes',
    details: (cpf: string) => `/pacientes/${cpf}`,
    create: '/pacientes',
    put: (id: string) => `/pacientes/${id}`,
    delete: (id: string) => `/pacientes/${id}`,
  },
  exams: {
    list: '/exames',
    details: (id: string) => `/exames/${id}`,
    create: '/exames',
    put: (id: string) => `/exames/${id}`,
    delete: (id: string) => `/exames/${id}`,
  },
} as const;
