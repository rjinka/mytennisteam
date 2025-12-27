import type { User, Group, Player, Court, Schedule, ApiErrorResponse } from '../types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    return fetch(url, mergedOptions);
};

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ msg: 'An unknown error occurred' }));
        throw new ApiError(errorData.msg || 'API Request failed', response.status);
    }
    return response.json();
};

export const api = {
    // Auth
    getSelf: () => fetchWithAuth(`${API_BASE_URL}/users/me?t=${Date.now()}`).then(handleResponse<User>),
    loginWithGoogle: (token: string) => fetchWithAuth(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        body: JSON.stringify({ token }),
    }).then(handleResponse<User>),
    logout: () => fetchWithAuth(`${API_BASE_URL}/users/logout`, { method: 'POST' }).then(handleResponse<{ msg: string }>),
    deleteSelf: () => fetchWithAuth(`${API_BASE_URL}/users/me`, { method: 'DELETE' }).then(handleResponse<{ msg: string }>),

    // Groups
    getPlayerGroups: () => fetchWithAuth(`${API_BASE_URL}/groups/player`).then(handleResponse<Group[]>),
    createGroup: (data: { name: string }) => fetchWithAuth(`${API_BASE_URL}/groups`, {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(handleResponse<Group>),
    updateGroup: (id: string, data: Partial<Group>) => fetchWithAuth(`${API_BASE_URL}/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }).then(handleResponse<Group>),
    deleteGroup: (id: string) => fetchWithAuth(`${API_BASE_URL}/groups/${id}`, { method: 'DELETE' }).then(handleResponse<{ msg: string }>),
    leaveGroup: (id: string) => fetchWithAuth(`${API_BASE_URL}/groups/${id}/leave`, { method: 'POST' }).then(handleResponse<{ msg: string }>),
    joinGroup: (id: string) => fetchWithAuth(`${API_BASE_URL}/groups/${id}/join`, { method: 'POST' }).then(handleResponse<{ msg: string }>),
    joinGroupByCode: (joinCode: string) => fetchWithAuth(`${API_BASE_URL}/groups/join-by-code`, {
        method: 'POST',
        body: JSON.stringify({ joinCode }),
    }).then(handleResponse<{ msg: string }>),
    invitePlayer: (groupId: string, email: string) => fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    }).then(handleResponse<{ msg: string }>),

    // Schedules
    getSchedules: (groupId: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${groupId}`).then(handleResponse<Schedule[]>),
    createSchedule: (data: Partial<Schedule>) => fetchWithAuth(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(handleResponse<Schedule>),
    updateSchedule: (id: string, data: Partial<Schedule>) => fetchWithAuth(`${API_BASE_URL}/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }).then(handleResponse<Schedule>),
    deleteSchedule: (id: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${id}`, { method: 'DELETE' }).then(handleResponse<{ msg: string }>),
    generateRotation: (id: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${id}/generate`, { method: 'POST' }).then(handleResponse<Schedule>),
    swapPlayers: (scheduleId: string, playerInId: string, playerOutId: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/swap`, {
        method: 'PUT',
        body: JSON.stringify({ playerInId, playerOutId }),
    }).then(handleResponse<Schedule>),
    getRotationButtonState: (id: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${id}/rotation-button-state`).then(handleResponse<{ visible: boolean, text: string, disabled: boolean, reason?: string }>),
    getScheduleSignups: (scheduleId: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/signups`).then(handleResponse<any[]>),
    completePlanning: (scheduleId: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/complete-planning`, { method: 'POST' }).then(handleResponse<Schedule>),
    shufflePlayers: (id: string) => fetchWithAuth(`${API_BASE_URL}/schedules/${id}/shuffle`, { method: 'PUT' }).then(handleResponse<Schedule>),

    // Players
    getPlayers: (groupId: string) => fetchWithAuth(`${API_BASE_URL}/players/${groupId}`)
        .then(handleResponse<any[]>)
        .then(players => players.map(p => ({
            ...p,
            name: p.user?.name || 'Unknown',
            email: p.user?.email || '',
            picture: p.user?.picture
        }))),
    updatePlayer: (id: string, data: Partial<Player>) => fetchWithAuth(`${API_BASE_URL}/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }).then(handleResponse<Player>),
    deletePlayer: (id: string) => fetchWithAuth(`${API_BASE_URL}/players/${id}`, { method: 'DELETE' }).then(handleResponse<{ msg: string }>),

    // Courts
    getCourts: (groupId: string) => fetchWithAuth(`${API_BASE_URL}/courts/${groupId}`).then(handleResponse<Court[]>),
    createCourt: (data: Partial<Court>) => fetchWithAuth(`${API_BASE_URL}/courts`, {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(handleResponse<Court>),
    updateCourt: (id: string, data: Partial<Court>) => fetchWithAuth(`${API_BASE_URL}/courts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }).then(handleResponse<Court>),
    deleteCourt: (id: string) => fetchWithAuth(`${API_BASE_URL}/courts/${id}`, { method: 'DELETE' }).then(handleResponse<{ msg: string }>),

    // Misc
    getVersion: () => fetchWithAuth(`${API_BASE_URL}/version`).then(handleResponse<{ version: string }>),
    submitSupport: (data: { message: string, groupId?: string }) => fetchWithAuth(`${API_BASE_URL}/support/contact`, {
        method: 'POST',
        body: JSON.stringify(data),
    }).then(handleResponse<{ msg: string }>),

    // Stats
    getScheduleStats: (scheduleId: string) => fetchWithAuth(`${API_BASE_URL}/stats/schedule/${scheduleId}`).then(handleResponse<any[]>),
    getPlayerStats: (playerId: string) => fetchWithAuth(`${API_BASE_URL}/stats/player/${playerId}`).then(handleResponse<any[]>),
};
