export interface User {
    id: string;
    name: string;
    email: string;
    picture?: string;
    isSuperAdmin: boolean;
}

export interface Group {
    id: string;
    name: string;
    admins: string[];
    joinCode?: string;
}

export interface Player {
    id: string;
    userId: string;
    name: string;
    email: string;
    groupId: string;
    availability: PlayerAvailability[];
}

export interface PlayerAvailability {
    scheduleId: string;
    type: 'Rotation' | 'Permanent' | 'Backup';
}

export interface Court {
    id: string;
    name: string;
    groupId: string;
}

export interface ScheduleCourt {
    courtId: string;
    gameType: '0' | '1'; // 0: Singles, 1: Doubles
}

export interface Schedule {
    occurrenceNumber: number;
    id: string;
    name: string;
    groupId: string;
    day: number;
    time: string;
    duration: number;
    recurring: boolean;
    frequency: number;
    recurrenceCount: number;
    maxPlayersCount: number;
    isRotationGenerated: boolean;
    courts: ScheduleCourt[];
    playingPlayersIds: string[];
    benchPlayersIds: string[];
    backupPlayersIds?: string[];
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
}

export interface ApiErrorResponse {
    msg: string;
}

export interface PlayerStatEntry {
    occurrenceNumber: number;
    status: 'played' | 'benched';
    date: string;
}

export interface PlayerStat {
    id: string;
    playerId: any; // Can be populated
    scheduleId: any; // Can be populated
    stats: PlayerStatEntry[];
}
