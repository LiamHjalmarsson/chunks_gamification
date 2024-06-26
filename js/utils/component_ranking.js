import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

// TVUNGEN ATT FLYTTA OM COMPONENTRANKING TILL UTILS FÖR ATT EXPORT SULLE FUNGERA


// ADD ON CLICK NEW COURSE CLOSE RANKINGS!!!!

export const ranking = { calculateRank, calculatePoints, calculateNextRank, patchBadges };
; (() => {
    SubPub.subscribe({
        event: "db::get::course::done",
        listener: () => {
            const progressDiv = document.getElementById("content_user_progress");
            progressDiv.style.padding = '0'
            progressDiv.style.height = '0';
            progressDiv.style.opacity = '0';
            setUserRank()
        }
    });

    SubPub.subscribe({
        event: "db::post::ranking::done",
        listener: () => {
            let userRank;
            state_io.state.rankings.forEach(user => {
                if (user.userId == state_io.state.user.user_id) {
                    userRank = user.rank;
                }
            })
            state_io.state.user.rank = userRank;
            patchBadges(`${state_io.state.course.course_id}.1`)
        }
    });

    SubPub.subscribe({
        event: "db::patch::userBadges::done",
        listener: calculateRank
    });
  
      SubPub.subscribe({
        event: "db::patch::streak::donee",
        listener: setUserRank
    });

    SubPub.subscribe({
        event: "db::patch::streak::done",
        listener: (response) => { checkStreakBadge(response) }
    });
})();

function setUserRank() {
    let userRank;
    state_io.state.rankings.forEach(user => {
        if (user.userId == state_io.state.user.user_id) {
            userRank = user.rank;
        }
    })
    // If the user has no current rank, initialize Bronze
    if (!userRank) {
        SubPub.publish({
            event: "db::post::ranking::request",
            detail: { params: { user_id: state_io.state.user.user_id, user_name: state_io.state.user.name, rank: "Bronze", points: 0, course: state_io.state.course.course_id } }
        })
    }
    // If the user DOES have a rank, add to state and publish done event
    else {
        state_io.state.user.rank = userRank;
        SubPub.publish({
            event: "ranking_done",
            detail: {}
        })
    }
}

// Calculates current rank
function calculateRank() {
    let rank;
    let badgenr;
    let totalPoints = calculatePoints();

    let allunits = state_io.state.units;

    let maxPoints = allunits.length * 3;

console.log(maxPoints);
  
    // if($points < ($maxPoints * 0.25)){
    //   $rank = "Bronze";
    // }elseif ($points >= ($totalpoints * 0.25) && $points <= ($totalpoints * 0.5)) {
    //   $rank = "Silver";
    // }elseif ($points >= ($totalpoints * 0.5) && $points <= ($totalpoints * 0.75)) {
    //   $rank = "Gold";
    // }elseif ($points >= ($totalpoints * 0.75) && $points <= $totalpoints) {
    //   $rank = "Diamond";
    // }else {
    //   $rank = "Platinum";
    // }

    switch (true) {
        case (totalPoints < (maxPoints * 0.25)):
            rank = "Bronze";
            badgenr = 1;
            break;
        case (totalPoints >= (maxPoints * 0.25) && totalPoints < (maxPoints * 0.5)):
            rank = "Silver";
            badgenr = 2;
            break;
        case (totalPoints >= (maxPoints * 0.5) && totalPoints < (maxPoints * 0.75)):
            rank = "Gold";
            badgenr = 3;
            break;
        case (totalPoints >= (maxPoints * 0.75) && totalPoints < maxPoints):
            rank = "Diamond";
            badgenr = 4;
            break;
        case (totalPoints >= maxPoints):
            rank = "Platinum";
            badgenr = 5;
            break;
        default:
            break;
    }

    // switch (true) {
    //     case (totalPoints <= 9):
    //         rank = "Bronze";
    //         badgenr = 1;
    //         break;
    //     case (totalPoints >= 10 && totalPoints <= 39):
    //         rank = "Silver";
    //         badgenr = 2;
    //         break;
    //     case (totalPoints >= 40 && totalPoints <= 69):
    //         rank = "Gold";
    //         badgenr = 3;
    //         break;
    //     case (totalPoints >= 70 && totalPoints <= 99):
    //         rank = "Diamond";
    //         badgenr = 4;
    //         break;
    //     case (totalPoints >= 100):
    //         rank = "Platinum";
    //         badgenr = 5;
    //         break;
    //     default:
    //         break;
    // }
    if (rank !== state_io.state.user.rank) {
        state_io.state.user.rank = rank;
        // // Patch rank in DB
        // SubPub.publish({
        //     event: `db::patch::ranking::request`,
        //     detail: { params: { user_id: state_io.state.user.user_id, rank: rank, course: state_io.state.course.course_id } }
        // });
        // Give badge for latest rank
        patchBadges(`${state_io.state.course.course_id}.${badgenr}`)
    }
}

// Returns object incl. next rank and percentage left
function calculateNextRank() {
    let nextRankTitle;
    let percentageDone;
    let totalPoints = state_io.state.rankings.filter(obj => obj.userId == state_io.state.user.user_id && obj.course == state_io.state.course.course_id)[0].points;

    if(totalPoints == ""){
        totalPoints = 0;
    }

    let allunits = state_io.state.units;
    let maxPoints = allunits.length * 3;

    switch (true) {
        case (totalPoints < (maxPoints * 0.25)):
            nextRankTitle = "Silver";
            percentageDone = (100 * getLastDigit(totalPoints)) / ((maxPoints * 0.5)-(maxPoints * 0.25));
            break;
        case (totalPoints >= (maxPoints * 0.25) && totalPoints < (maxPoints * 0.5)):
            nextRankTitle = "Gold";
            percentageDone = (100 * getLastDigit(totalPoints)) / ((maxPoints * 0.75)-(maxPoints * 0.5));
            break;
        case (totalPoints >= (maxPoints * 0.5) && totalPoints < (maxPoints * 0.75)):
            nextRankTitle = "Diamond";
            percentageDone = (100 * getLastDigit(totalPoints)) / ((maxPoints)-(maxPoints * 0.75));
            break;
        case (totalPoints >= (maxPoints * 0.75) && totalPoints < maxPoints):
            nextRankTitle = "Platinum";
            percentageDone = (100 * getLastDigit(totalPoints)) / maxPoints;
            break;
        case (totalPoints >= maxPoints):
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

// Calculates total points
function calculatePoints() {
    // If no badges and no high streak
    if (state_io.state.user.badges == [] && !state_io.state.user.high_Streak) {
        return 0;
    }

    // If no badges but a high streak
    if (state_io.state.user.badges == [] && state_io.state.user.high_Streak) {
        return parseInt(state_io.state.user.high_Streak)
    }

    // If badges but no high streak
    if (state_io.state.user.badges !== [] && !state_io.state.user.high_Streak) {
        let badges = [];
        let userBadges = state_io.state.user.badges;
        // Remove first and last character [] and split on ,
        userBadges = (userBadges.substring(1, userBadges.length - 1)).split(',');
        // Checking if the badge belongs to the current course
        userBadges.forEach(badge => {
            if (badge.split('.')[0] == state_io.state.course.course_id)
                badges.push(badge);
        });
        let totalPoints = parseInt(badges.length);
        return totalPoints;
    }

    // If both badges and high streak avaliable
    if (state_io.state.user.badges !== [] && state_io.state.user.high_Streak) {
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
}

// Gets last digit of number for use in percentage calculation
function getLastDigit(number) {
    let digit = number.toString();
    let lastDigit = digit.charAt(digit.length - 1);
    return parseInt(lastDigit);
}

// Add new badge to user
// newBadge param to be formatted: course.badgenr
// Example for course 2 with badge number 13  =  2.13
// This will correlate with the badge in the database with the id 213
function patchBadges(newBadge) {
    let userBadges = state_io.state.user.badges;
    if (userBadges == "[]") {
        userBadges = `[${newBadge}]`
    } else {
        userBadges = userBadges.slice(0, -1);
        userBadges = userBadges + "," + newBadge + "]";
    }
    SubPub.publish({
        event: `db::patch::userBadges::request`,
        detail: { params: { user_id: state_io.state.user.user_id, badges: userBadges } }
    });
}

function checkStreakBadge(response) {
    let streak = parseInt(response.response.high_Streak[0].high_Streak);
    let userBadges = state_io.state.user.badges;
    // Remove first and last character [] and split on ,
    userBadges = (userBadges.substring(1, userBadges.length - 1)).split(',');

    console.log(streak)
    if (streak >= 50) {
        if (!userBadges.includes(`${state_io.state.course.course_id}.8`)) {
            patchBadges(`${state_io.state.course.course_id}.8`)
        }
    } else if (streak >= 10) {
        console.log("hello")
        if (!userBadges.includes(`${state_io.state.course.course_id}.7`)) {
            patchBadges(`${state_io.state.course.course_id}.7`)
        }
    }

}

//setTimeout(() => { patchBadges(2.6) }, 3000)
