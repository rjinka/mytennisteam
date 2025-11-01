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

export const swapPlayers = async (scheduleId, playerBeingSwappedId, swapPartnerId, swapActionDirection) => {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/swapPlayers`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ playerBeingSwappedId, swapPartnerId, swapActionDirection }),
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

export const getAdminGroups = async () => {
    const response = await fetch(`${API_BASE_URL}/groups/admin`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new ApiError('Failed to fetch groups', response.status);
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

export const getSchedules = async () => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        // Try to parse the error message from the backend for better debugging
        const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch schedules' }));
        throw new ApiError(errorData.msg, response.status);
    }
    return response.json();
};
// Placeholder functions for other API calls used in the frontend context
// These would typically be implemented to interact with your backend's respective routes.
export const getPlayerStats = async (playerId, scheduleId) => {
    const response = await fetch(`${API_BASE_URL}/playerstats/${playerId}/${scheduleId}`, {
        headers: getAuthHeaders(),
    });
    if (response.status === 404) {
        // It's not an error if stats don't exist yet, just return an empty structure.
        return { playerId, scheduleId, stats: [] };
    }
    if (!response.ok) {
        throw new ApiError('Failed to fetch player stats', response.status);
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
export const getPlayers = async () => {
    const response = await fetch(`${API_BASE_URL}/players`, { headers: getAuthHeaders() });
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

export const getCourts = async () => {
    const response = await fetch(`${API_BASE_URL}/courts`, { headers: getAuthHeaders() });
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

export const verifyInvitation = async (token) => {
    const response = await fetch(`${API_BASE_URL}/invitations/verify/${token}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to verify invitation', response.status);
    }
    return response.json();
};

export const acceptInvitation = async (token) => {
    const response = await fetch(`${API_BASE_URL}/invitations/accept/${token}`, { method: 'POST', headers: getAuthHeaders() });
    if (!response.ok) throw new ApiError('Failed to accept invitation', response.status);
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