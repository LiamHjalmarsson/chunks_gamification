import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

// TVUNGEN ATT FLYTTA OM COMPONENTRANKING TILL UTILS FÖR ATT EXPORT SULLE FUNGERA

export const ranking = { calculateRank, calculatePoints, calculateNextRank };
; (() => {
})();

// Calculates current rank
function calculateRank() {
    let rank;

    let totalPoints = calculatePoints()
    switch (true) {
        case (totalPoints <= 9):
            rank = "Bronze";
            break;
        case (totalPoints >= 10 && totalPoints <= 19):
            rank = "Silver";
            break;
        case (totalPoints >= 20 && totalPoints <= 29):
            rank = "Gold";
            break;
        case (totalPoints >= 30 && totalPoints <= 39):
            rank = "Diamond";
            break;
        case (totalPoints >= 40):
            rank = "Platinum";
            break;
        default:
            break;
    }

    return rank;
}

// Returns object incl. next rank and percentage left
function calculateNextRank() {
    let nextRankTitle;
    let percentageDone;
    let totalPoints = calculatePoints()
    switch (true) {
        case (totalPoints <= 9):
            nextRankTitle = "Silver";
            percentageDone = (100 * getLastDigit(totalPoints)) / 10;
            break;
        case (totalPoints >= 10 && totalPoints <= 19):
            nextRankTitle = "Gold";
            percentageDone = (100 * getLastDigit(totalPoints)) / 10;
            break;
        case (totalPoints >= 20 && totalPoints <= 29):
            nextRankTitle = "Diamond";
            percentageDone = (100 * getLastDigit(totalPoints)) / 10;
            break;
        case (totalPoints >= 30 && totalPoints <= 39):
            nextRankTitle = "Platinum";
            percentageDone = (100 * getLastDigit(totalPoints)) / 10;
            break;
        case (totalPoints >= 40):
            nextRankTitle = "You're at the highest rank!";
            percentageDone = 100;
            break;
        default:
            break;
    }
    let nextRank = {
        nextRank: nextRankTitle,
        percentageDone: percentageDone
    }
    return nextRank;
}

// Gets last digit of number for use in percentage calculation
function getLastDigit(number) {
    let digit = number.toString();
    let lastDigit = digit.charAt(digit.length - 1);
    return parseInt(lastDigit);
}

// Calculates total points
function calculatePoints() {
    let badges = [];
    let userBadges = state_io.state.user.badges;
    // Remove first and last character [] and split on ,
    userBadges = (userBadges.substring(1, userBadges.length - 1)).split(',');
    // Checking if the badge belongs to the current course
    userBadges.forEach(badge => {
        if (badge.split('.')[0] == state_io.state.course.course_id)
            badges.push(badge);
    });
    let totalPoints = parseInt(badges.length) + parseInt(state_io.state.user.high_Streak);
    return totalPoints;
}