import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

// TVUNGEN ATT FLYTTA OM COMPONENTRANKING TILL UTILS FÖR ATT EXPORT SULLE FUNGERA

export const ranking = { calculateRank, calculatePoints, calculateNextRank, patchBadges };
; (() => {
    SubPub.subscribe({
        event: "db::patch::userBadges::done",
        listener: calculateRank
    });
})();

// Calculates current rank
function calculateRank() {
    let rank;
    let badgenr;
    let totalPoints = calculatePoints()
    switch (true) {
        case (totalPoints <= 9):
            rank = "Bronze";
            badgenr = 1;
            break;
        case (totalPoints >= 10 && totalPoints <= 19):
            rank = "Silver";
            badgenr = 2;
            break;
        case (totalPoints >= 20 && totalPoints <= 29):
            rank = "Gold";
            badgenr = 3;
            break;
        case (totalPoints >= 30 && totalPoints <= 39):
            rank = "Diamond";
            badgenr = 4;
            break;
        case (totalPoints >= 40):
            rank = "Platinum";
            badgenr = 5;
            break;
        default:
            break;
    }
    if (rank !== state_io.state.user.rank) {
        // Patch rank in DB
        SubPub.publish({
            event: `db::patch::userRank::request`,
            detail: { params: { user_id: state_io.state.user.user_id, rank: rank } }
        });
        // Give badge for latest rank
        patchBadges(`${state_io.state.course.course_id}.${badgenr}`)
    }
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

// Add new badge to user
// newBadge param to be formatted: course.badgenr
// Example for course 2 with badge number 13  =  2.13
// This will correlate with the badge in the database with the id 213
function patchBadges(newBadge) {
    let userBadges = state_io.state.user.badges;
    userBadges = userBadges.slice(0, -1).replace(" ", "");
    userBadges = userBadges + "," + newBadge + "]";

    SubPub.publish({
        event: `db::patch::userBadges::request`,
        detail: { params: { user_id: state_io.state.user.user_id, badges: userBadges } }
    });
}

setTimeout(() => { patchBadges(2.3) }, 3000)