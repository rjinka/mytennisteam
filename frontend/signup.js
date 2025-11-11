import * as api from './api.js';
import { showMessageBox, showLoading } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const scheduleId = urlParams.get('scheduleId');
    if (scheduleId) {
        loadSignups(scheduleId);
    }
});

async function loadSignups(scheduleId) {
    showLoading(true);
    try {
        const signups = await api.getScheduleSignups(scheduleId);
        renderSignups(signups, scheduleId);
    } catch (error) {
        console.error('Error loading signups:', error);
        showMessageBox('Error', 'Failed to load signups.');
    } finally {
        showLoading(false);
    }
}

function renderSignups(signups, scheduleId) {
    const container = document.getElementById('signups-container');
    container.innerHTML = '';

    if (signups.length === 0) {
        container.innerHTML = '<p>No players have signed up for this schedule yet.</p>';
    } else {
        const table = document.createElement('table');
        table.className = 'min-w-full bg-white';
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="py-2 px-4 border-b">Player Name</th>
                    <th class="py-2 px-4 border-b">Availability</th>
                </tr>
            </thead>
            <tbody>
                ${signups.map(signup => `
                    <tr>
                        <td class="py-2 px-4 border-b">${signup.playerName}</td>
                        <td class="py-2 px-4 border-b">${signup.availabilityType}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        container.appendChild(table);
    }

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'mt-4';
    actionsContainer.innerHTML = `
        <button id="complete-planning-btn" class="bg-blue-500 text-white px-4 py-2 rounded">Complete Planning</button>
        <button id="delete-schedule-btn" class="bg-red-500 text-white px-4 py-2 rounded ml-2">Delete Schedule</button>
    `;
    container.appendChild(actionsContainer);

    document.getElementById('complete-planning-btn').addEventListener('click', async () => {
        showLoading(true);
        try {
            await api.completeSchedulePlanning(scheduleId);
            showMessageBox('Success', 'Planning completed successfully.', () => {
                window.location.href = '/';
            });
        } catch (error) {
            console.error('Error completing planning:', error);
            showMessageBox('Error', 'Failed to complete planning.');
        } finally {
            showLoading(false);
        }
    });

    document.getElementById('delete-schedule-btn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this schedule?')) {
            showLoading(true);
            try {
                await api.deleteSchedule(scheduleId);
                showMessageBox('Success', 'Schedule deleted successfully.', () => {
                    window.location.href = '/';
                });
            } catch (error) {
                console.error('Error deleting schedule:', error);
                showMessageBox('Error', 'Failed to delete schedule.');
            } finally {
                showLoading(false);
            }
        }
    });
}
