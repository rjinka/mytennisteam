import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Group, Schedule, Player, Court } from '../types';
import { api } from '../api';

interface AppContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    groups: Group[];
    setGroups: (groups: Group[]) => void;
    currentGroup: Group | null;
    setCurrentGroup: (group: Group | null) => void;
    schedules: Schedule[];
    setSchedules: (schedules: Schedule[]) => void;
    players: Player[];
    setPlayers: (players: Player[]) => void;
    courts: Court[];
    setCourts: (courts: Court[]) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    refreshGroups: () => Promise<void>;
    refreshCurrentGroupData: () => Promise<void>;
    selectedScheduleId: string | null;
    setSelectedScheduleId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    const refreshGroups = async () => {
        try {
            const data = await api.getPlayerGroups();
            setGroups(data);
        } catch (error) {
            console.error('Failed to refresh groups:', error);
        }
    };

    const refreshCurrentGroupData = async () => {
        if (!currentGroup) return;
        // Don't set global loading to true for refreshes to avoid unmounting the app
        try {
            const [schedulesData, playersData, courtsData] = await Promise.all([
                api.getSchedules(currentGroup.id),
                api.getPlayers(currentGroup.id),
                api.getCourts(currentGroup.id),
            ]);
            setSchedules(schedulesData);
            setPlayers(playersData);
            setCourts(courtsData);
        } catch (error) {
            console.error('Failed to refresh group data:', error);
        }
    };

    useEffect(() => {
        if (currentGroup) {
            setSelectedScheduleId(null); // Reset selection when switching groups
            refreshCurrentGroupData();
        }
    }, [currentGroup]);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                groups,
                setGroups,
                currentGroup,
                setCurrentGroup,
                schedules,
                setSchedules,
                players,
                setPlayers,
                courts,
                setCourts,
                loading,
                setLoading,
                refreshGroups,
                refreshCurrentGroupData,
                selectedScheduleId,
                setSelectedScheduleId,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
