const fs = require('fs');
const path = require('path');
const { calculatePointsForGeneratedInteractions, calculatePointsForInteractionsWithOthers, calculatePointsForTimeSpent, calculatePointsForTimeReceived } = require('./calculPoints');

// Load and parse JSON data only once
const loadData = () => {
    const jsonFilePath = path.join(__dirname, '../data/modele.json');
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

// Fonction pour récupérer les données entre deux dates et pour un forum (Operations.Message.Forum) donné (si spécifié)
const getFilteredData = (data, startDateStr = null, endDateStr = null, forum) => {

    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);

    const filteredData = data.filter(item => {
        const actionDate = parseDate(item.Operation.Action.Date);

        // Convert forum to a number for comparison
        const forumMatch = (forum && forum !== "") ? parseInt(item.Operation.Message.Attributes.Forum) === parseInt(forum) : true;

        // Check if actionDate is within the date range and forum matches
        return actionDate >= startDate && actionDate <= endDate && forumMatch;
    });
    return filteredData;
};

//creer une liste de toutes les dates entre startDate et endDate
const getDateList = (startDateStr, endDateStr) => {
    const { startDate, endDate } = getDateRange(startDateStr, endDateStr);
    const dateList = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateList;
};

// Calculate points for generated interactions
exports.pointsForGeneratedInteractions = (startDateStr = null, endDateStr = null, forum) => {

    const dateList = getDateList(startDateStr, endDateStr);

    const filteredData = getFilteredData(data, startDateStr, endDateStr, forum);

    const users = allUsers();
    return calculatePointsForGeneratedInteractions(users, filteredData, dateList);
};

// Calculate points for interactions with others
exports.pointsForInteractionsWithOthers = (startDateStr = null, endDateStr = null, forum) => {
    
    const dateList = getDateList(startDateStr, endDateStr);

    const filteredData = getFilteredData(data, startDateStr, endDateStr, forum);

    const users = allUsers();
    return calculatePointsForInteractionsWithOthers(users, filteredData, dateList);
};

// Calculate points for time spent
exports.pointsForTimeSpent = (startDateStr = null, endDateStr = null, forum = null) => {

    const dateList = getDateList(startDateStr, endDateStr);
    
    const filteredData = getFilteredData(data, startDateStr, endDateStr, forum);

    const users = allUsers();
    return calculatePointsForTimeSpent(users, filteredData, dateList);
};

// Calculate points for time received
exports.pointsForTimeReceived = (startDateStr = null, endDateStr = null, forum) => {

    const dateList = getDateList(startDateStr, endDateStr);

    const filteredData = getFilteredData(data, startDateStr, endDateStr, forum);

    const users = allUsers();
    return calculatePointsForTimeReceived(users, filteredData, dateList);
};

// Calculate total points
exports.totalPoints = (startDate = null, endDate = null, forum) => {

    const generatedPoints = this.pointsForGeneratedInteractions(startDate, endDate, forum);
    const interactionPoints = this.pointsForInteractionsWithOthers(startDate, endDate, forum);
    const timeSpentPoints = this.pointsForTimeSpent(startDate, endDate, forum);
    const timeReceivedPoints = this.pointsForTimeReceived(startDate, endDate, forum);

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
