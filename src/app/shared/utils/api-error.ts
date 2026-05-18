import { HttpErrorResponse } from '@angular/common/http';

type ApiErrorContext = 'patient' | 'exam' | 'generic';

type ApiErrorOptions = {
  context?: ApiErrorContext;
  fallbackMessage?: string;
  networkMessage?: string;
};

const DEFAULT_FALLBACK_MESSAGE = 'Ocorreu um erro, tente novamente';
const DEFAULT_NETWORK_MESSAGE = 'Falha de rede. Tentar novamente.';

export function getApiErrorMessage(error: unknown, options: ApiErrorOptions = {}): string {
  const fallbackMessage = options.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE;
  const networkMessage = options.networkMessage ?? DEFAULT_NETWORK_MESSAGE;

  if (!(error instanceof HttpErrorResponse)) {
    return fallbackMessage;
  }

  if (error.status === 0) {
    return networkMessage;
  }

  const rawMessage = extractErrorMessage(error.error) ?? error.message ?? '';

  return mapBackendErrorMessage(rawMessage, options.context) ?? fallbackMessage;
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === 'string') {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    const value =
      candidate['message'] ??
      candidate['error'] ??
      candidate['detail'] ??
      candidate['title'] ??
      candidate['statusText'];

    if (typeof value === 'string') {
      return value;
    }
  }

  return undefined;
}

function mapBackendErrorMessage(message: string, context?: ApiErrorContext): string | undefined {
  const normalized = message.trim().toLowerCase();

  switch (normalized) {
    case 'cpf already registered':
      return 'CPF já cadastrado.';
    case 'invalid cpf':
      return 'CPF inválido.';
    case 'name is required':
      return 'Nome obrigatório.';
    case 'cpf is required':
      return 'CPF obrigatório.';
    case 'phone is required':
      return 'Telefone obrigatório.';
    case 'birthdate is required':
      return 'Data de nascimento obrigatória.';
    case 'patient not found':
      return 'Paciente não encontrado.';
    case 'idempotencykey is required':
      return 'Chave de idempotência obrigatória.';
    case 'idempotency key already registered':
      return 'Chave de idempotência já cadastrada.';
    case 'descricao is required':
      return 'Descrição obrigatória.';
    case 'modality is required':
      return 'Modalidade obrigatória.';
    case 'examdate is required':
      return 'Data do exame obrigatória.';
    case 'not found':
      return context === 'exam'
        ? 'Exame não encontrado.'
        : context === 'patient'
          ? 'Paciente não encontrado.'
          : 'Registro não encontrado.';
    default:
      return undefined;
  }
}
