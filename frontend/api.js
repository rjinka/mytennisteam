// Use Vite's environment variables to set the API base URL.
// import.meta.env.VITE_API_BASE_URL is replaced at build time.
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const swapPlayers = async (scheduleId, playerInId, playerOutId) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/swap`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ playerInId, playerOutId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to swap players', response.status);
    }

    return response.json();
};

export const createSchedule = async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create schedule', response.status);
    }
    return response.json();
};

export const updateSchedule = async (scheduleId, scheduleData) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update schedule', response.status);
    }
    return response.json();
};

export const generateRotation = async (scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to generate rotation', response.status);
    }
    return response.json();
};

export const getRotationButtonState = async (scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/rotation-button-state`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to get button state', response.status);
    }
    return response.json();
};

export const deleteSchedule = async (scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to delete schedule', response.status);
    }
    return response.json();
};

export const createGroup = async (groupData) => {
    const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create group', response.status);
    }
    return response.json();
};

export const updateGroup = async (groupId, groupData) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update group', response.status);
    }
    return response.json();
};

export const updateGroupAdmins = async (groupId, adminUserIds) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/admins`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminUserIds }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update group admins', response.status);
    }
    return response.json();
};

export const getPlayerGroups = async () => {
    const response = await fetch(`${API_BASE_URL}/groups/player`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new ApiError('Failed to fetch player groups', response.status);
    return response.json();
};

export const getSchedules = async (groupId = '') => {
    const url = groupId ? `${API_BASE_URL}/schedules/${groupId}` : `${API_BASE_URL}/schedules`;
    const response = await fetch(url, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        // Try to parse the error message from the backend for better debugging
        const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch schedules' }));
        throw new ApiError(errorData.msg, response.status);
    }
    return response.json();
};

export const getScheduleStats = async (scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/stats/schedule/${scheduleId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new ApiError('Failed to fetch schedule stats', response.status);
    }
    return response.json();
};

export const getPlayerStats = async (playerId) => {
    const response = await fetch(`${API_BASE_URL}/stats/player/${playerId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new ApiError('Failed to fetch all player stats', response.status);
    }
    return response.json();
};

export const createPlayerStat = async (statData) => {
    const response = await fetch(`${API_BASE_URL}/playerstats`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(statData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create player stat', response.status);
    }
    return response.json();
};
export const updatePlayerStat = async (id, statData) => {
    const response = await fetch(`${API_BASE_URL}/playerstats/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(statData),
    });
    if (!response.ok) {
        throw new ApiError('Failed to update player stat', response.status);
    }
    return response.json();
};

export const updateCourt = async (courtId, courtData) => {
    const response = await fetch(`${API_BASE_URL}/courts/${courtId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(courtData),
    });
    if (!response.ok) { 
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update court', response.status);
    }
    return response.json();
};
export const getPlayers = async (groupId = '') => {
    const url = groupId ? `${API_BASE_URL}/players/${groupId}` : `${API_BASE_URL}/players`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new ApiError('Failed to fetch players', response.status);
    return response.json();
};

export const createPlayer = async (playerData) => {
    const response = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(playerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create player', response.status);
    }
    return response.json();
};

export const updatePlayer = async (playerId, playerData) => {
    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(playerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update player', response.status);
    }
    return response.json();
};

export const deletePlayer = async (playerId) => {
    const response = await fetch(`${API_BASE_URL}/players/${playerId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new ApiError('Failed to delete player', response.status);
    return response.json();
};

export const getCourts = async (groupId = '') => {
    const url = groupId ? `${API_BASE_URL}/courts/${groupId}` : `${API_BASE_URL}/courts`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new ApiError('Failed to fetch courts', response.status);
    return response.json();
};

export const createCourt = async (courtData) => {
    const response = await fetch(`${API_BASE_URL}/courts`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(courtData) });
    if (!response.ok) throw new Error('Failed to create court');
    return response.json();
};

export const deleteCourt = async (courtId) => {
    const response = await fetch(`${API_BASE_URL}/courts/${courtId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to delete court');
    return response.json();
};

export const deleteGroup = async (groupId) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to delete group');
    return response.json();
};

export const invitePlayer = async (groupId, email) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to send invitation', response.status);
    }
    return response.json();
};

export const verifyInvitation = async (join_token) => {
    const response = await fetch(`${API_BASE_URL}/invitations/verify/${join_token}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to verify invitation', response.status);
    }
    return response.json();
};

export const acceptInvitation = async (join_token) => {
    const response = await fetch(`${API_BASE_URL}/invitations/accept/${join_token}`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new ApiError('Failed to accept invitation', response.status);
    return response.json();
};

export const joinGroup = async (groupId) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to join group', response.status);
    }
    return response.json();
};

export const authenticateWithGoogle = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Google authentication failed', response.status);
    }
    return response.json();
};