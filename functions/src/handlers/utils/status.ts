import { MusicApi } from "../../types/music-api";

export const TASK_STATUS_ORDER = [
    'PENDING',
    'TEXT_SUCCESS',
    'FIRST_SUCCESS',
    'SUCCESS',
    'CREATE_TASK_FAILED',
    'GENERATE_AUDIO_FAILED',
    'CALLBACK_EXCEPTION',
    'SENSITIVE_WORD_ERROR',
] as MusicApi.TaskStatus[];

export const SUCCESS_STATUSES = ["SUCCESS", "FIRST_SUCCESS", "TEXT_SUCCESS"] as MusicApi.TaskStatus[];
export const FAILURE_STATUSES = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"] as MusicApi.TaskStatus[];

const TASK_STATUS_ORDER_MAP: Record<MusicApi.TaskStatus, number> = Object.fromEntries(
    TASK_STATUS_ORDER.map((s, i) => [s, i]),
) as Record<MusicApi.TaskStatus, number>;

export const getTaskStatusOrder = (status: MusicApi.TaskStatus) => {
    return TASK_STATUS_ORDER_MAP[status];
}

export function isNextStage(prev: MusicApi.TaskStatus, next: MusicApi.TaskStatus): boolean {
    return TASK_STATUS_ORDER_MAP[next] === TASK_STATUS_ORDER_MAP[prev] + 1;
}

export function hasAdvanced(prev: MusicApi.TaskStatus, next: MusicApi.TaskStatus): boolean {
    return TASK_STATUS_ORDER_MAP[next] > TASK_STATUS_ORDER_MAP[prev];
}

export function hasRegressed(prev: MusicApi.TaskStatus, next: MusicApi.TaskStatus): boolean {
    return TASK_STATUS_ORDER_MAP[next] < TASK_STATUS_ORDER_MAP[prev];
}