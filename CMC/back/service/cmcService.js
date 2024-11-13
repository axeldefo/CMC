const fs = require('fs');
const path = require('path');
const { calculatePointsForGeneratedInteractions, calculatePointsForInteractionsWithOthers, calculatePointsForTimeSpent, calculatePointsForTimeReceived } = require('./calculPoints');

// Load and parse JSON data only once
const loadData = () => {
    const jsonFilePath = path.join(__dirname, '../data/mdd.json');
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
    return JSON.parse(jsonData);
};

const data = loadData(); // Load data once

// Get all unique users from the loaded data
const allUsers = () => {
    const users = new Set();
    data.forEach(item => {
        const user = item.Operation.User.Name;
        if (user) {
            users.add(user);
        }
    });
    return Array.from(users);
};

// Parse date in standard format
const parseDate = (dateStr) => new Date(dateStr);

// Calculate and store min and max dates only once
const getMinMaxDates = () => {
    const dates = data.map(item => parseDate(item.Operation.Action.Date));
    return {
        minDate: new Date(Math.min(...dates)),
        maxDate: new Date(Math.max(...dates))
    };
};

const { minDate, maxDate } = getMinMaxDates(); // Only calculate once

// Extract unique forum names
const getAllForums = () => [...new Set(data
    .map(item => item.Operation.Message.Attributes.Forum)
    .filter(forum => forum.trim() !== "")
)];

// Function to return default data
exports.defaultData = () => ({
    minDate,
    maxDate,
    forums: getAllForums()
});

// Utility to get start and end dates, using defaults if not provided
const getDateRange = (startDateStr, endDateStr) => {
    const startDate = startDateStr ? parseDate(startDateStr) : minDate;
    const endDate = endDateStr ? parseDate(endDateStr) : maxDate;
    return { startDate, endDate };
};

// Calculate points for generated interactions
exports.pointsForGeneratedInteractions = (startDateStr = null, endDateStr = null, forum) => {
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const users = allUsers();
    return calculatePointsForGeneratedInteractions(users, data, startDate, endDate, forum);
};

// Calculate points for interactions with others
exports.pointsForInteractionsWithOthers = (startDateStr = null, endDateStr = null, forum) => {
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const users = allUsers();
    return calculatePointsForInteractionsWithOthers(users, data, startDate, endDate, forum);
};

// Calculate points for time spent
exports.pointsForTimeSpent = (startDateStr = null, endDateStr = null, forum = null) => {
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const users = allUsers();
    return calculatePointsForTimeSpent(users, data, startDate, endDate, forum);
};

// Calculate points for time received
exports.pointsForTimeReceived = (startDateStr = null, endDateStr = null, forum) => {
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const users = allUsers();
    return calculatePointsForTimeReceived(users, data, startDate, endDate, forum);
};

// Calculate total points
exports.totalPoints = (startDate = null, endDate = null, forum) => {
    const { startDate: start, endDate: end } = getDateRange(startDate, endDate);

    const generatedPoints = this.pointsForGeneratedInteractions(start, end, forum);
    const interactionPoints = this.pointsForInteractionsWithOthers(start, end, forum);
    const timeSpentPoints = this.pointsForTimeSpent(start, end, forum);
    const timeReceivedPoints = this.pointsForTimeReceived(start, end, forum);

    const totalPoints = {};
    const allUsersSet = new Set([
        ...Object.keys(generatedPoints),
        ...Object.keys(interactionPoints),
        ...Object.keys(timeSpentPoints),
        ...Object.keys(timeReceivedPoints)
    ]);

    allUsersSet.forEach(user => {
        totalPoints[user] = {};
        const allDates = new Set([
            ...Object.keys(generatedPoints[user] || {}),
            ...Object.keys(interactionPoints[user] || {}),
            ...Object.keys(timeSpentPoints[user] || {}),
            ...Object.keys(timeReceivedPoints[user] || {})
        ]);

        allDates.forEach(date => {
            totalPoints[user][date] = (
                (generatedPoints[user]?.[date] || 0) +
                (interactionPoints[user]?.[date] || 0) +
                (timeSpentPoints[user]?.[date] || 0) +
                (timeReceivedPoints[user]?.[date] || 0)
            );
        });
    });

    const sortedResults = {};
    Object.entries(totalPoints)
        .sort(([, a], [, b]) => b.totalPoints - a.totalPoints)
        .forEach(([user, points]) => sortedResults[user] = points);

    return sortedResults;
};
