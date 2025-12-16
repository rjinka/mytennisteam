// Use Vite's environment variables to set the API base URL.
// import.meta.env.VITE_API_BASE_URL is replaced at build time.
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Helper function to create authenticated fetch requests
const fetchWithAuth = async (url, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // This is crucial for sending httpOnly cookies
    };

    const mergedOptions = { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } };
    return fetch(url, mergedOptions);
};

export const swapPlayers = async (scheduleId, playerInId, playerOutId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/swap`, {
        method: 'PUT',
        body: JSON.stringify({ playerInId, playerOutId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to swap players', response.status);
    }

    return response.json();
};

export const createSchedule = async (scheduleData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules`, {
        method: 'POST',
        body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create schedule', response.status);
    }
    return response.json();
};

export const getScheduleSignups = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/signups`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to fetch schedule signups', response.status);
    }
    return response.json();
};

export const completeSchedulePlanning = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/complete-planning`, {
        method: 'POST',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to complete schedule planning', response.status);
    }
    return response.json();
};

export const getVersion = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/version`);
    if (!response.ok) {
        throw new ApiError('Failed to fetch version', response.status);
    }
    return response.json();
};

export const updateSchedule = async (scheduleId, scheduleData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(scheduleData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update schedule', response.status);
    }
    return response.json();
};

export const generateRotation = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/generate`, {
        method: 'POST',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to generate rotation', response.status);
    }
    return response.json();
};

export const getRotationButtonState = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}/rotation-button-state`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to get button state', response.status);
    }
    return response.json();
};

export const deleteSchedule = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/schedules/${scheduleId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to delete schedule', response.status);
    }
    return response.json();
};

export const createGroup = async (groupData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups`, {
        method: 'POST',
        body: JSON.stringify(groupData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create group', response.status);
    }
    return response.json();
};

export const updateGroup = async (groupId, groupData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}`, {
        method: 'PUT',
        body: JSON.stringify(groupData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update group', response.status);
    }
    return response.json();
};

export const updateGroupAdmins = async (groupId, adminUserIds) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/admins`, {
        method: 'PUT',
        body: JSON.stringify({ adminUserIds }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update group admins', response.status);
    }
    return response.json();
};

export const getPlayerGroups = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/player`, {
        method: 'GET',
    });
    if (!response.ok) throw new ApiError('Failed to fetch player groups', response.status);
    return response.json();
};

export const getSchedules = async (groupId = '') => {
    const url = groupId ? `${API_BASE_URL}/schedules/${groupId}` : `${API_BASE_URL}/schedules`;
    const response = await fetchWithAuth(url);
    if (!response.ok) {
        // Try to parse the error message from the backend for better debugging
        const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch schedules' }));
        throw new ApiError(errorData.msg, response.status);
    }
    return response.json();
};

export const getScheduleStats = async (scheduleId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/stats/schedule/${scheduleId}`);
    if (!response.ok) {
        throw new ApiError('Failed to fetch schedule stats', response.status);
    }
    return response.json();
};

export const getPlayerStats = async (playerId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/stats/player/${playerId}`);
    if (!response.ok) {
        throw new ApiError('Failed to fetch all player stats', response.status);
    }
    return response.json();
};

export const createPlayerStat = async (statData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/playerstats`, {
        method: 'POST',
        body: JSON.stringify(statData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create player stat', response.status);
    }
    return response.json();
};
export const updatePlayerStat = async (id, statData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/playerstats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(statData),
    });
    if (!response.ok) {
        throw new ApiError('Failed to update player stat', response.status);
    }
    return response.json();
};

export const updateCourt = async (courtId, courtData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/courts/${courtId}`, {
        method: 'PUT',
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
    const response = await fetchWithAuth(url);
    if (!response.ok) throw new ApiError('Failed to fetch players', response.status);
    return response.json();
};

export const createPlayer = async (playerData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/players`, {
        method: 'POST',
        body: JSON.stringify(playerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to create player', response.status);
    }
    return response.json();
};

export const updatePlayer = async (playerId, playerData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify(playerData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to update player', response.status);
    }
    return response.json();
};

export const deletePlayer = async (playerId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/players/${playerId}`, { method: 'DELETE' });
    if (!response.ok) throw new ApiError('Failed to delete player', response.status);
    return response.json();
};

export const getCourts = async (groupId = '') => {
    const url = groupId ? `${API_BASE_URL}/courts/${groupId}` : `${API_BASE_URL}/courts`;
    const response = await fetchWithAuth(url);
    if (!response.ok) throw new ApiError('Failed to fetch courts', response.status);
    return response.json();
};

export const createCourt = async (courtData) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/courts`, { method: 'POST', body: JSON.stringify(courtData) });
    if (!response.ok) throw new Error('Failed to create court');
    return response.json();
};

export const deleteCourt = async (courtId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/courts/${courtId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete court');
    return response.json();
};

export const deleteGroup = async (groupId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete group');
    return response.json();
};

export const invitePlayer = async (groupId, email) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to send invitation', response.status);
    }
    return response.json();
};

export const verifyInvitation = async (join_token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/invitations/verify/${join_token}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to verify invitation', response.status);
    }
    return response.json();
};

export const acceptInvitation = async (join_token) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/invitations/accept/${join_token}`, { method: 'POST' });
    if (!response.ok) throw new ApiError('Failed to accept invitation', response.status);
    return response.json();
};

export const joinGroup = async (groupId) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/${groupId}/join`, {
        method: 'POST',
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to join group', response.status);
    }
    return response.json();
};

export const logout = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
    });
    if (!response.ok) throw new ApiError('Logout failed', response.status);
    return response.json();
};

/**
 * Fetches the current user's data from the backend.
 * This relies on the httpOnly cookie being sent by the browser.
 * A successful response means the user is authenticated.
 */
export const getSelf = async () => {
    // Add a cache-busting parameter to prevent browsers from caching a 401 response
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me?t=${new Date().getTime()}`);
    if (!response.ok) throw new ApiError('Failed to fetch user data', response.status);
    return response.json();
};

/**
 * Sends a request to the backend to delete the current user's account.
 */
export const deleteSelf = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new ApiError((await response.json()).msg || 'Failed to delete account', response.status);
    return response.json();
};

// This function should be added to c/Projects/mytennisteam/frontend/api.js
export async function submitSupport(data) {
    const response = await fetchWithAuth(`${API_BASE_URL}/support/contact`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to send support request.', response.status);
    }
    return response.json();
}
export const joinGroupByCode = async (joinCode) => {
    const response = await fetchWithAuth(`${API_BASE_URL}/groups/join-by-code`, {
        method: 'POST',
        body: JSON.stringify({ joinCode }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(errorData.msg || 'Failed to join group', response.status);
    }
    return response.json();
};
